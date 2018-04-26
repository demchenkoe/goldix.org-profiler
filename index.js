const NS_PER_SEC = 1e9;
const NS_PER_MSEC = 1e6;

class Profiler {
  /**
   * @param {object} options
   * @param {number} options.valuesMax          maximum values for statistics and avg
   * @param {string} options.units              one of hrtime|nanoseconds|milliseconds|seconds|string|all
   * @param {function} options.onProfilerEnd    function(duration, profiler, arguments)
   */
  constructor(options) {
    this.options = {
      valuesMax: 0,
      units: 'milliseconds',
      ...options,
    };
    this.initState();
  }
  
  initState() {
    this.state = {};
    
    if (this.options.valuesMax) {
      this.state.last = [];
    } else {
      this.start();
    }
  }
  
  /**
   * Start profiling
   */
  
  start() {
    this._start = process.hrtime();
  }
  
  /**
   * End profiling
   * @returns {*}
   */
  
  end() {
    let t = process.hrtime(this._start);
    if (this.options.valuesMax) {
      this.state.last.push(t);
      if (this.state.last.length > this.options.valuesMax) {
        this.state.last.splice(0, this.state.last.length - this.options.valuesMax);
      }
    }
  
    let duration = this.convertHrtime(t, this.options.units);
    
    if(typeof this.options.onProfilerEnd === 'function') {
      this.options.onProfilerEnd(duration, this, arguments);
    }
    
    return duration;
  }
  
  /**
   * Calc average value by last profiling measurements
   * @returns {*}
   */
  
  avg() {
    if (!this.state.last || !this.state.last.length) return 0;
    let sum = 0;
    for (let i = 0; i < this.state.last.length; i++) {
      sum += this.state.last[i][0] * NS_PER_SEC + this.state.last[i][1];
    }
    let avg = sum / this.state.last.length;
    let sec = Math.floor(avg / NS_PER_SEC);
    let nano = avg - sec * NS_PER_SEC;
    return [sec, nano];
  }
  
  /**
   * Returns statistics as minimum, maximum and average values by last profiling measurements
   * @returns {*}
   */
  
  stat() {
    if (!this.state.last || !this.state.last.length) return {
      min: [0, 0],
      max: [0, 0],
      avg: [0, 0]
    };
    
    let [sum, min, max] = [0, Number.MAX_VALUE, 0];
    for (let i = 0; i < this.state.last.length; i++) {
      let val = this.state.last[i][0] * NS_PER_SEC + this.state.last[i][1];
      val > max && (max = val);
      val < min && (min = val);
      sum += val;
    }
    let avg = sum / this.state.last.length;
    
    return {
      min: this.nanoToHrTime(min),
      max: this.nanoToHrTime(max),
      avg: this.nanoToHrTime(avg)
    };
  }
  
  
  convertHrtime(hrtime, units = 'hrtime') {
    const nanoseconds = (hrtime[0] * 1e9) + hrtime[1];
    const milliseconds = nanoseconds / NS_PER_MSEC;
    const seconds = nanoseconds / NS_PER_SEC;
    switch(units) {
      case 'hrtime': return hrtime;
      case 'nanoseconds': return nanoseconds;
      case 'milliseconds': return milliseconds;
      case 'seconds': return seconds;
      case 'string': return this.toString(hrtime);
      case 'all':
      default: return {
        hrtime,
        nanoseconds,
        milliseconds,
        seconds,
        string: this.toString(hrtime)
      }
    }
  }
  
  nanoToHrTime(val) {
    let sec = Math.floor(val / NS_PER_SEC);
    let nano = val - sec * NS_PER_SEC;
    return [sec, nano];
  }
  
  toString(hrtime) {
    if(hrtime[0] > 1000) {
      return (hrtime[0] / 1000).toFixed(3) + ' sec';
    }
    return `${hrtime[0]}.${hrtime[1]} msec`;
  }
}

module.exports = { Profiler };