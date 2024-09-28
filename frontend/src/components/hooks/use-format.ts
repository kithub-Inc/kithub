export const useFormat = (number: number): string | number => {
    const tier = Math.log10(Math.abs(number)) / 3 | 0;
    if (tier === 0) return number;

    const suffix = `kMGTPE`[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = number / scale;

    return scaled.toFixed(1) + suffix;
}