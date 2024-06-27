const core = require('@actions/core')
const exec = require('@actions/exec')
const io = require('@actions/io')
const fs = require('node:fs/promises')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const file = core.getInput('check-file', { required: true })
    const requirementsTxt = await fs.readFile(file, 'utf-8')
    const pattern = /([a-zA-Z0-9-_.]+)(?:==([0-9.]*))?/g

    let match
    const packages = []

    while ((match = pattern.exec(requirementsTxt)) !== null) {
      const packageName = match[1]
      const packageVersion = match[2] || ''
      packages.push({ name: packageName, version: packageVersion })
    }

    const pythonPath = await io.which('python', true)
    await exec.getExecOutput(`"${pythonPath}"`, [
      './typos_tool/setup.py',
      'install'
    ])
    await exec.getExecOutput(`myproject`, ['--update'])

    // summary
    const summary = await core.summary

    for (const pkg of packages) {
      await exec.getExecOutput(`myproject`, [pkg.name])

      const content = await fs.readFile('./final_typos.json')
      const json = JSON.parse(content)

      core.setOutput('check-output', json)

      const list = []
      for (const i of json[pkg.name]) {
        if (i[1] >= 3.0 && Math.abs(i[1] - 1) > Number.EPSILON) {
          core.warning(
            `Something went wrong. Suspicious package name detected: ${i[0]}.`,
            { title: 'Found Suspicious Package' }
          )
        }
        if (Math.abs(i[1] - 1) > Number.EPSILON) {
          list.push([{ data: i[0] }, { data: i[1].toFixed(2) }])
        }
      }
      summary.addHeading(`Typosquatting Detection: ${pkg.name}`).addTable([
        [
          { data: 'Package', header: true },
          { data: 'Result', header: true }
        ],
        ...list.sort((a, b) => parseFloat(b[1].data) - parseFloat(a[1].data))
      ])
    }
    summary.write()
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
