const CHAR_SET = 'abcdefghijklmnopqrstuvwxyz0123456789';

const char = (): string => {
    const randomIndex = Math.floor(Math.random() * CHAR_SET.length);
    return CHAR_SET[randomIndex];
};

const string = (length: number): string => {
    let result = '';
    for (let i = 0; i < length; i++) result += char();
    return result;
};

export const uuid = (): string => {
    const part1 = string(2);
    const part2 = string(6);
    return `${part1}-${part2}`;
};
