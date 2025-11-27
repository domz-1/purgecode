import ansiEscapes from 'ansi-escapes';
const blockMap = {
    'P': ['████ ', '█   █', '████ ', '█    ', '█    '],
    'U': ['█   █', '█   █', '█   █', '█   █', '█████'],
    'R': ['████ ', '█   █', '████ ', '█  █ ', '█   █'],
    'G': [' ████', '█    ', '█  ██', '█   █', ' ████'],
    'E': ['█████', '█    ', '████ ', '█    ', '█████'],
    'C': [' ████', '█    ', '█    ', '█    ', ' ████'],
    'O': [' ████', '█   █', '█   █', '█   █', ' ████'],
    'D': ['████ ', '█   █', '█   █', '█   █', '████ '],
    ' ': ['     ', '     ', '     ', '     ', '     ']
};
export function showBanner(text = "PURGECODE") {
    let result = ['', '', '', '', ''];
    for (let char of text.toUpperCase()) {
        const block = blockMap[char] || blockMap[' '];
        for (let i = 0; i < 5; i++) {
            result[i] += block[i] + '  '; // Add spacing between letters
        }
    }
    console.log('\n');
    result.forEach(row => console.log(ansiEscapes.cursorTo(0) + row));
    console.log('\n');
}
