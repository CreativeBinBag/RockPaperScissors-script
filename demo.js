import crypto from 'crypto'; //module to provide cryptographic functionality (secret key and HMAC generation)
import readline from 'readline'; //module to read data from a readable stream
import yargs from 'yargs'; //to better parse command-line arguments
import { hideBin } from 'yargs/helpers'; //function for extracting script-specific arguments
import chalk from 'chalk'; //for coloring terminal output

import Table from 'cli-table3'; // Import the third-party table library

class HelpTable {
    constructor(moves, winMatrix) {
        this.moves = moves;
        this.winMatrix = winMatrix;
    }

    generate() {
        const table = new Table({
            head: [''].concat(this.moves),
            colWidths: Array(this.moves.length + 1).fill(15) // Adjust column widths as needed
        });

        this.moves.forEach((move, i) => {
            table.push([move].concat(this.winMatrix[i]));
        });

        return table.toString();
    }
}

class Rules {
    constructor(moves) {
        this.moves = moves;
        this.winMatrix = this.createWinMatrix();
    }

    createWinMatrix() {
        const size = this.moves.length;
        const matrix = Array.from({ length: size }, () => Array(size).fill('Draw'));

        for (let i = 0; i < size; i++) {
            for (let j = 1; j <= size / 2; j++) {
                matrix[i][(i + j) % size] = 'Win';
                matrix[i][(i - j + size) % size] = 'Lose';
            }
        }
        return matrix;
    }

    getResult(move1, move2) {
        const index1 = this.moves.indexOf(move1);
        const index2 = this.moves.indexOf(move2);
        return this.winMatrix[index1][index2];
    }

    generateHelpTable() {
        const helpTable = new HelpTable(this.moves, this.winMatrix);
        return helpTable.generate();
    }
}

class KeyGenerator {
    static generateKey() {
        return crypto.randomBytes(32).toString('hex').toUpperCase();
    }

    static calculateHMAC(key, message) {
        return crypto.createHmac('sha256', Buffer.from(key, 'hex')).update(message).digest('hex').toUpperCase();
    }
}

class Game {
    constructor(moves) {
        this.moves = moves;
        this.rules = new Rules(moves);
    }

    displayHelp() {
        console.log(chalk.yellow(this.rules.generateHelpTable()));
    }

    displayMenu() {
        console.log(chalk.blue('Available moves:'));
        this.moves.forEach((move, index) => console.log(chalk.cyan(`${index + 1} - ${move}`)));
        console.log(chalk.magenta('0 - exit'));
        console.log(chalk.green('? - help'));
    }

    play(userMove) {
        this.computerMove = this.moves[Math.floor(Math.random() * this.moves.length)];
        this.key = KeyGenerator.generateKey();
        const hmac = this.getHMAC();
        const result = this.rules.getResult(userMove, this.computerMove);
        console.log(chalk.yellow(`HMAC: ${hmac}`));
        console.log(chalk.green(`Your move: ${userMove}`));
        console.log(chalk.red(`Computer move: ${this.computerMove}`));
        console.log(result === 'Win' ? chalk.green('You win!') : result === 'Lose' ? chalk.red('You lose!') : chalk.yellow('It\'s a draw!'));
        console.log(chalk.blue(`HMAC key: ${this.key}`));
    }

    getHMAC() {
        return KeyGenerator.calculateHMAC(this.key, this.computerMove);
    }
}

// Parse command-line arguments using yargs
const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options] <moves...>')
    .demandCommand(3, 'You need to provide at least 3 moves.')
    .option('help', {
        alias: 'h',
        describe: 'Show help',
        type: 'boolean',
    })
    .example('$0 rock Spock paper lizard scissors', 'Play the rock-paper-scissors-lizard-Spock game')
    .check((argv) => {
        if (argv._.length % 2 === 0) throw new Error('Number of moves must be odd.');
        if (new Set(argv._).size !== argv._.length) throw new Error('Moves must be unique.');
        return true;
    })
    .argv;

if (argv.help) {
    console.log(yargs.getUsageInstance().getHelp());
    process.exit(0);
}

const moves = argv._;
const game = new Game(moves);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const prompt = () => {
    rl.question(chalk.cyan('Enter your move: '), (input) => {
        if (input === '?') {
            game.displayHelp();
        } else if (input === '0') {
            rl.close();
            return;
        } else if (input >= 1 && input <= moves.length) {
            const userMove = moves[input - 1];
            game.play(userMove);
        } else {
            console.log(chalk.red('Invalid move. Please try again.'));
            game.displayMenu();
        }
        prompt();
    });
};

game.displayMenu();
prompt();
