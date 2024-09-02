const crypto = require('crypto');
const readline = require('readline');

class Rule {
  constructor(moves) {
    this.moves = moves;
    this.moveCount = moves.length;
    this.halfCount = Math.floor(this.moveCount / 2);
  }

  determineWinner(playerMove, computerMove) {
    const playerIndex = this.moves.indexOf(playerMove);
    const computerIndex = this.moves.indexOf(computerMove);
    const difference = (playerIndex - computerIndex + this.moveCount) % this.moveCount;
    return difference < this.halfCount ? 'player' : difference > this.halfCount ? 'computer' : 'draw';
  }
}

class Table {
  constructor(moves) {
    this.moves = moves;
  }

  generateTable() {
    const table = [];

    // Header row
    const headerRow = ['|     |']
      .concat(this.moves.map(move => ` ${move.padStart(4)} |`))
      .join('');
    table.push(headerRow);

    // Separator row
    const separator = `+-----+${this.moves.map(() => '-----+').join('')}`;
    table.push(separator);

    // Body rows
    this.moves.forEach(move => {
      const row = [`| ${move.padStart(4)} |`]
        .concat(this.moves.map(opponentMove => {
          const rule = new Rule(this.moves);
          const result = rule.determineWinner(move, opponentMove);
          return ` ${result.padStart(4)} |`;
        }))
        .join('');
      table.push(row);
      table.push(separator);
    });

    // Explanation
    const explanation = '\nTable shows the outcome of each move against the others. "W" indicates a win, "L" a loss, and "D" a draw.';
    table.push(explanation);

    return table.join('\n');
  }
}


class Cryptography {
  generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  calculateHMAC(key, message) {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(message);
    return hmac.digest('hex');
  }
}

class Game {
  constructor(moves) {
    this.moves = moves;
    this.rule = new Rule(moves);
    this.crypto = new Cryptography();
  }

  play() {
    const computerMove = this.moves[Math.floor(Math.random() * this.moves.length)];
    const key = this.crypto.generateKey();
    const hmac = this.crypto.calculateHMAC(key, computerMove);

    console.log('HMAC:', hmac);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const showMenu = () => {
      console.log('HMAC:', hmac);
      console.log('Available moves:');
      this.moves.forEach((move, index) => {
        console.log(`${index + 1} - ${move}`);
      });
      console.log('0 - Exit');
      console.log('? - Help');   

    };


    const handleUserChoice = (choice) => {
      if (choice === '0') {
        rl.close();
        return;
      }
      if (choice === '?') {
        const table = new Table(this.moves);
        console.log(table.generateTable());
        showMenu();
        return;
      }
      const playerMove = this.moves[choice - 1];
      if (!playerMove) {
        console.log('Invalid choice. Please try again.');
        showMenu();
        return;
      }

      const winner = this.rule.determineWinner(playerMove, computerMove);
      console.log(`Computer played: ${computerMove}`);
      console.log(`You played: ${playerMove}`);
      console.log(`Winner: ${winner}`);
      console.log('Key:', key);

      rl.close();
    };

    showMenu();
    rl.question('Your choice: ', handleUserChoice);
  }
}
const args = process.argv.slice(2);

if (args.length < 3 || args.length % 2 === 0) {
  console.error('Error: Invalid number of arguments. Please provide an odd number of moves (>= 3).');
  console.error('Example: node script.js Rock Paper Scissors Lizard Spock');
  process.exit(1);
}

const moves = args;

const game = new Game(moves);

if (process.argv.includes('--help')) {
  const table = new Table(moves);
  console.log(table.generateTable());
} else {
  game.play();
}
