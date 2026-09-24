import type { TaskActions } from '../app/taskActions'

const nothing = () => undefined

/** Every action a row takes, doing nothing: spread it and override the ones a test watches. */
export const NO_TASK_ACTIONS: TaskActions = {
  complete: nothing,
  uncomplete: nothing,
  rename: nothing,
  changeDescription: nothing,
  changeDay: nothing,
  changeTime: nothing,
  skip: nothing,
  changeRepeat: nothing,
  changeReward: nothing,
  changeUrgent: nothing,
  changeTimeGoal: nothing,
  logTime: nothing,
  removeTimeEntry: nothing,
  changeList: nothing,
  addTag: nothing,
  removeTag: nothing,
  remove: nothing,
  duplicate: nothing,
  addSubtask: nothing,
  setSubtaskDone: nothing,
  renameSubtask: nothing,
  removeSubtask: nothing,
}
