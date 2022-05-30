import { Analyser } from "tone";

export type FrequencyNames = "bass" | "lowMid" | "mid" | "highMid" | "treble";

class AudioEnergy extends Analyser {
  _updated: boolean;
  _buffer: number[];
  frequencyRanges: { [name: string]: [number, number] };

  constructor(sampleCount = 2048) {
    super("fft", sampleCount);
    this._updated = false;
    this._buffer = [];

    this.frequencyRanges = {
      bass: [20, 140],
      lowMid: [140, 400],
      mid: [400, 2600],
      highMid: [2600, 5200],
      treble: [5200, 14000],
    };
  }

  _map(
    n: number,
    start1: number,
    stop1: number,
    start2: number,
    stop2: number
  ) {
    return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
  }

  _log(n: number, logBase = 10) {
    return Math.log(n) / Math.log(logBase);
  }

  _lerp(start: number, stop: number, amt: number) {
    return amt * (stop - start) + start;
  }

  update() {
    this._updated = true;
    this.getValue();
  }

  getEnergyAtHz(hz: number) {
    const nyquist = this.context.sampleRate / 2;
    const frequencyBinCount = this.size;
    return Math.max(
      0,
      Math.min(
        frequencyBinCount - 1,
        Math.floor((hz / nyquist) * frequencyBinCount)
      )
    );
  }

  getEnergyBins(
    logarithmic = false,
    n = this.size,
    minFreq: number,
    maxFreq: number
  ) {
    if (!this._updated) {
      throw new Error("getEnergy() error: You must call energy.update() first");
    }

    const minFrequency = minFreq || 0;
    const maxFrequency = maxFreq || this.context.sampleRate / 2;
    const logBase = 10;
    const minFrequencyLog = this._log(Math.max(1, minFrequency), logBase);
    const maxFrequencyLog = this._log(Math.max(1, maxFrequency), logBase);

    const bands = [];
    for (let i = 0; i < n; i++) {
      const minT = i / n;
      const maxT = minT + 1 / n;
      let minHz, maxHz;
      if (logarithmic) {
        minHz = Math.pow(
          logBase,
          this._lerp(minFrequencyLog, maxFrequencyLog, minT)
        );
        maxHz = Math.pow(
          logBase,
          this._lerp(minFrequencyLog, maxFrequencyLog, maxT)
        );
      } else {
        minHz = this._lerp(minFrequency, maxFrequency, minT);
        maxHz = this._lerp(minFrequency, maxFrequency, maxT);
      }

      const energy = this.getEnergy().byHz(minHz, maxHz);
      bands.push(energy);
    }
    return bands;
  }

  getEnergy() {
    if (!this._updated) {
      throw new Error("getEnergy() error: You must call energy.update() first");
    }

    const computeReturnValue = (low: number, high: number) => {
      const lowIndex = this.getEnergyAtHz(low);
      const highIndex = this.getEnergyAtHz(high);

      const buffer = this["_buffers"] as number[][];
      let total = 0;
      let numFrequencies = 0;

      // add up all of the values for the frequencies
      for (let i = lowIndex; i <= highIndex; i++) {
        total += buffer[0][i];
        numFrequencies++;
      }

      // divide by total number of frequencies
      return total / numFrequencies;
    };

    return {
      byHz: (minHz: number, maxHz: number) => {
        return computeReturnValue(minHz, maxHz);
      },
      byFrequency: (frequency: FrequencyNames) => {
        if (frequency in this.frequencyRanges) {
          const range = this.frequencyRanges[frequency];
          return computeReturnValue(range[0], range[1]);
        } else {
          throw new Error(
            `getEnergy() error: No range called ${frequency} - possible ranges are: ${Object.keys(
              this.frequencyRanges
            ).join(", ")}`
          );
        }
      },
    };
  }
}

export default AudioEnergy;
