const core = require('@actions/core')
const { wait } = require('./wait')
const exec = require('@actions/exec')
const io = require('@actions/io')

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
    const { stdout } = await exec.getExecOutput(`"${pythonPath}"`, [
      '-c',
      'import time;time.time()'
    ])
    // Set outputs for other workflow steps to use
    core.setOutput('time', stdout)
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
