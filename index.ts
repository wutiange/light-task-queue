class LightTaskQueue {
  private constructor() { }
  private uniqueTask: Map<any, boolean> = new Map()
  private queue: Array<any> = [];
  private frequency: number = 0;
  private numberOfFailures: number = 0;
  private failureTaskCount: Map<any, number> = new Map()
  private startTime: number = 0;
  private isUnique: boolean = true;
  private isStarted: boolean = false;
  private ongoing: boolean = false;
  private frequencyTimer?: NodeJS.Timeout;
  private startTimeTimer?: NodeJS.Timeout;
  private static instance: LightTaskQueue | null = null;
  public static getInstance() {
    if (LightTaskQueue.instance === null) {
      LightTaskQueue.instance = new LightTaskQueue()
    }
    return new LightTaskQueue()
  }

  public setFrequency(frequency: number) {
    if (!this.isStarted) {
      this.frequency = frequency
    }
    return this
  }

  public setNumberOfFailures(numberOfFailures: number) {
    if (!this.isStarted) {
      this.numberOfFailures = numberOfFailures
    }
    return this
  }

  public setStartTime(startTime: number) {
    if (!this.isStarted) {
      this.startTime = startTime
    }
    return this
  }

  public setIsUnique(isUnique: boolean) {
    if (!this.isStarted) {
      this.isUnique = isUnique;
    }
    return this
  }

  public addTask(task: any) {
    if (this.isUnique) {
      if (!this.uniqueTask.has(task)) {
        this.uniqueTask.set(task, true)
        this.in(task)
      }
    } else {
      this.in(task)
    }
    this.failureTaskCount.set(task, this.numberOfFailures)
    return this
  }

  private in(task: any) {
    this.queue.push(task)
    if (this.isStarted && !this.ongoing) {
      this.startTask()
    }
  }

  private out() {
    return this.queue.shift()
  }

  private async asyncTask(currentTask?: any) {
    this.frequencyTimer && clearTimeout(this.frequencyTimer)
    if (!currentTask) {
      this.ongoing = false;
    }
    try {
      await currentTask?.()
      this.uniqueTask.delete(currentTask)
      this.failureTaskCount.delete(currentTask)
      this.frequencyTimer = setTimeout(() => {
        this.asyncTask(this.out())
      }, this.frequency)
    } catch (err) {
      const currentFailureCount = this.failureTaskCount.get(currentTask) ?? 0
      if (currentFailureCount !== 0) {
        this.failureTaskCount.set(currentTask, currentFailureCount - 1)
        this.in(currentTask)
      } else {
        this.uniqueTask.delete(currentTask)
        this.failureTaskCount.delete(currentTask)
      }
    }
  }

  public startTask() {
    // 如果正在进行中，就无需重复调用
    if (this.ongoing) {
      return
    }
    this.isStarted = true;
    if (this.queue.length === 0) {
      return;
    }
    this.ongoing = true;
    let currentTask: any = null
    this.startTimeTimer = setTimeout(() => {
      currentTask = this.out()
      this.asyncTask(currentTask)
      this.startTimeTimer && clearTimeout(this.startTimeTimer)
    }, this.startTime)
  }

  public stopTask() {
    this.isStarted = false;
  }

  public static Builer() {
    return new LightTaskQueue()
  }
}


export default LightTaskQueue