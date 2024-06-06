const core = require('@actions/core')
const exec = require('@actions/exec')
const io = require('@actions/io')
const fs = require('node:fs/promises')
const { wait } = require('./wait')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const ms = core.getInput('milliseconds', { required: true })

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Waiting ${ms} milliseconds ...`)

    // Log the current timestamp, wait, then log the new timestamp
    core.debug(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

    const pythonPath = await io.which('python', true)
    const pipPath = await io.which('pip', true)
    await exec.exec(
      `"${pipPath}" install requests sentence-transformers pipdeptree lxml tqdm pyxdameraulevenshtein`
    )
    await exec.getExecOutput(`"${pythonPath}"`, ['./src/tool.py', '--update'])

    await exec.getExecOutput(`"${pythonPath}"`, ['./src/tool.py', 'setuptools'])
    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString())

    const content = await fs.readFile('./typosquatting_results.json')
    const json = JSON.parse(content)
    // summary
    await core.summary
      .addHeading('Results')
      .addTable([
        [
          { data: 'Package', header: true },
          { data: 'Result', header: true }
        ],
        [...json['setuptools']]
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
