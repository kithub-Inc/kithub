#!/usr/bin/env node
const fs = require('fs-extra');
const yargs = require('yargs');
const readline = require('readline');

// CLI 옵션 설정
// const argv = yargs
//   .usage('Usage: $0 <file1> <file2> [options]')
//   .demandCommand(2)
//   .help('h')
//   .alias('h', 'help')
//   .argv;

// 파일 내용 읽기
// const [file1, file2] = argv._;

async function mergeFiles() {
  try {
    const content1 = `
    const main = (asdf: string): string => {
        return asdf.replace(/a/g, "#");
    }
    
    console.log(main("qwfqwweffsadfasfqwsdffa"))
    console.log(true);
    `;

    const content2 = `
    const main = (asdf: string): string => {
        return asdf.replace(/a/g, "#");
        
    }
    
    console.log(main("qwfqwweffsadfasfqwsdffa"));
    console.log(false);
    `;

    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    let mergedContent = '';

    for (let i = 0; i < Math.max(lines1.length, lines2.length); i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';

      if (line1 === line2) {
        mergedContent += line1 + '\n';
      } else {
        // 충돌이 발생하면 사용자 입력을 받아 해결
        mergedContent += await resolveConflict(line1, line2);
      }
    }

    await fs.writeFile('merged_output.txt', mergedContent, 'utf-8');
    console.log('병합 완료! merged_output.txt에 결과 저장.');
  } catch (error) {
    console.error('파일을 읽거나 병합하는 도중 오류 발생:', error);
  }
}

function resolveConflict(line1, line2) {
  return new Promise((resolve) => {
    console.log('충돌 발생:');
    console.log('1:', line1);
    console.log('2:', line2);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('어느 줄을 사용할까요? (1/2): ', (answer) => {
      rl.close();
      if (answer === '1') {
        resolve(line1 + '\n');
      } else {
        resolve(line2 + '\n');
      }
    });
  });
}

mergeFiles();