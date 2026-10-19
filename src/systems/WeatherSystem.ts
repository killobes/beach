// OCEAN GAIA V3.2 — Weather System
// 세션 B 소유 — Three.js import 금지

import { WEATHER_EFFECTS, type WeatherType, type Season, type WeatherEffect } from '../data/world';

export interface WeatherState {
  current: WeatherType;
  next: WeatherType;
  transitionProgress: number; // 0-1
  timer: number; // seconds until next change
  intensity: number; // 0-1
  windSpeed: number; // m/s
  waveHeight: number; // meters
  temperature: number; // °C (surface)
  visibility: number; // meters
}

export interface WeatherConfig {
  minDuration: number; // seconds
  maxDuration: number;
  transitionDuration: number; // seconds
  stormChance: number; // 0-1
}

const DEFAULT_WEATHER_CONFIG: WeatherConfig = {
  minDuration: 120,
  maxDuration: 600,
  transitionDuration: 30,
  stormChance: 0.15,
};

// Season-specific weather probabilities
const SEASON_WEIGHTS: Record<Season, Record<WeatherType, number>> = {
  spring: { clear: 35, cloudy: 25, rain: 20, storm: 5, fog: 10, snow: 5 },
  summer: { clear: 45, cloudy: 20, rain: 15, storm: 10, fog: 5, snow: 5 },
  autumn: { clear: 20, cloudy: 25, rain: 25, storm: 10, fog: 15, snow: 5 },
  winter: { clear: 10, cloudy: 20, rain: 10, storm: 10, fog: 15, snow: 35 },
};

// Temperature ranges by season
const SEASON_TEMPS: Record<Season, { min: number; max: number }> = {
  spring: { min: 15, max: 25 },
  summer: { min: 22, max: 32 },
  autumn: { min: 10, max: 20 },
  winter: { min: -5, max: 10 },
};

export class WeatherSystem {
  private config: WeatherConfig;
  private state: WeatherState;

  constructor(config: WeatherConfig = DEFAULT_WEATHER_CONFIG) {
    this.config = config;
    this.state = {
      current: 'clear',
      next: 'clear',
      transitionProgress: 1,
      timer: config.minDuration + Math.random() * (config.maxDuration - config.minDuration),
      intensity: 0.5,
      windSpeed: 5,
      waveHeight: 0.5,
      temperature: 20,
      visibility: 1000,
    };
  }

  /**
   * Update weather state
   */
  update(dtSec: number, season: Season, rng: () => number): void {
    this.state.timer -= dtSec;

    // Transition
    if (this.state.transitionProgress < 1) {
      this.state.transitionProgress += dtSec / this.config.transitionDuration;
      if (this.state.transitionProgress >= 1) {
        this.state.transitionProgress = 1;
        this.state.current = this.state.next;
      }
    }

    // Timer expired → new weather
    if (this.state.timer <= 0 && this.state.transitionProgress >= 1) {
      this.state.next = this.selectNextWeather(season, rng);
      this.state.transitionProgress = 0;
      this.state.timer = this.config.minDuration + rng() * (this.config.maxDuration - this.config.minDuration);
    }

    // Update environmental values
    this.updateEnvironment(season, rng);
  }

  /**
   * Select next weather based on season and current state
   */
  private selectNextWeather(season: Season, rng: () => number): WeatherType {
    const weights = SEASON_WEIGHTS[season];

    // Storm chance increases if currently rainy
    const adjustedWeights = { ...weights };
    if (this.state.current === 'rain' && rng() < this.config.stormChance) {
      adjustedWeights.storm += 30;
    }

    // Snow more likely after rain in winter
    if (season === 'winter' && this.state.current === 'rain') {
      adjustedWeights.snow += 20;
    }

    const totalWeight = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
    let roll = rng() * totalWeight;

    for (const [weather, weight] of Object.entries(adjustedWeights)) {
      roll -= weight;
      if (roll <= 0) return weather as WeatherType;
    }

    return 'clear';
  }

  /**
   * Update environmental parameters
   */
  private updateEnvironment(season: Season, rng: () => number): void {
    const effect = this.getCurrentEffect();
    const tempRange = SEASON_TEMPS[season];

    // Smooth interpolation
    const lerp = this.state.transitionProgress;
    const targetIntensity = this.getIntensityForWeather(this.state.transitionProgress < 1 ? this.state.next : this.state.current);

    this.state.intensity = this.lerp(this.state.intensity, targetIntensity, 0.01);
    this.state.windSpeed = this.lerp(this.state.windSpeed, this.getWindSpeed(effect), 0.05);
    this.state.waveHeight = this.lerp(this.state.waveHeight, this.getWaveHeight(effect), 0.05);
    this.state.temperature = tempRange.min + rng() * (tempRange.max - tempRange.min);
    this.state.visibility = effect.visibilityMod * 1000;
  }

  /**
   * Get the effective weather (blended during transition)
   */
  getCurrentEffect(): WeatherEffect {
    if (this.state.transitionProgress >= 1) {
      return WEATHER_EFFECTS[this.state.current];
    }

    // Blend between current and next
    const currentEffect = WEATHER_EFFECTS[this.state.current];
    const nextEffect = WEATHER_EFFECTS[this.state.next];
    const t = this.state.transitionProgress;

    return {
      type: t > 0.5 ? this.state.next : this.state.current,
      visibilityMod: this.lerp(currentEffect.visibilityMod, nextEffect.visibilityMod, t),
      moveSpeedMod: this.lerp(currentEffect.moveSpeedMod, nextEffect.moveSpeedMod, t),
      catchMod: this.lerp(currentEffect.catchMod, nextEffect.catchMod, t),
      spawnMod: {
        tropical: this.lerp(currentEffect.spawnMod.tropical, nextEffect.spawnMod.tropical, t),
        glacier: this.lerp(currentEffect.spawnMod.glacier, nextEffect.spawnMod.glacier, t),
        volcanic: this.lerp(currentEffect.spawnMod.volcanic, nextEffect.spawnMod.volcanic, t),
        mangrove: this.lerp(currentEffect.spawnMod.mangrove, nextEffect.spawnMod.mangrove, t),
        ocean: this.lerp(currentEffect.spawnMod.ocean, nextEffect.spawnMod.ocean, t),
        deepsea: this.lerp(currentEffect.spawnMod.deepsea, nextEffect.spawnMod.deepsea, t),
      },
    };
  }

  getState(): WeatherState {
    return { ...this.state };
  }

  private getIntensityForWeather(weather: WeatherType): number {
    switch (weather) {
      case 'clear': return 0.1;
      case 'cloudy': return 0.3;
      case 'rain': return 0.6;
      case 'storm': return 1.0;
      case 'fog': return 0.5;
      case 'snow': return 0.7;
    }
  }

  private getWindSpeed(effect: WeatherEffect): number {
    return (1 - effect.moveSpeedMod) * 50 + 5;
  }

  private getWaveHeight(effect: WeatherEffect): number {
    return (1 - effect.moveSpeedMod) * 5 + 0.3;
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * Math.max(0, Math.min(1, t));
  }
}
