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
    const name = core.getInput('package', { required: true })

    const pythonPath = await io.which('python', true)
    const pipPath = await io.which('pip', true)
    await exec.exec(
      `"${pipPath}" install requests sentence-transformers pipdeptree lxml tqdm pyxdameraulevenshtein`
    )
    await exec.getExecOutput(`"${pythonPath}"`, ['./src/tool.py', '--update'])
    await exec.getExecOutput(`"${pythonPath}"`, ['./src/tool.py', name])

    const content = await fs.readFile('./typosquatting_results.json')
    const json = JSON.parse(content)

    core.setOutput('package', json)

    const list = []
    for (const i of json[name]) {
      if (i[1] >= 0.85 && Math.abs(i[1] - 1) > Number.EPSILON) {
        core.warning(
          `Something went wrong. Suspicious package name detected: ${i[0]}.`,
          { title: 'Found Suspicious Package' }
        )
      }
      if (Math.abs(i[1] - 1) > Number.EPSILON) {
        list.push([{ data: i[0] }, { data: i[1].toFixed(2) }])
      }
    }
    // summary
    await core.summary
      .addHeading('Typosquatting Detection')
      .addTable([
        [
          { data: 'Package', header: true },
          { data: 'Result', header: true }
        ],
        ...list.sort((a, b) => parseFloat(b[1].data) - parseFloat(a[1].data))
      ])
      .write()
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
