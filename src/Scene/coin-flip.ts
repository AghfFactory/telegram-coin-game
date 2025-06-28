import Phaser from 'phaser';
import { connectToServer, type FlipMessage } from './network';
import { getPlayerInfo } from './telegram';

export default class CoinFlipScene extends Phaser.Scene {
  private resultText!: Phaser.GameObjects.Text;
  private flipButton!: Phaser.GameObjects.Rectangle;
  private flipButtonText!: Phaser.GameObjects.Text;
  private retryButton!: Phaser.GameObjects.Rectangle;
  private retryButtonText!: Phaser.GameObjects.Text;
  private flipping = false;
  private currentCoin?: Phaser.GameObjects.Image;
  private socket?: WebSocket;
  private playerId = '';
  private roomId = '';
  private isMyTurn = false;
  private isOnline = false;
  private hand!: Phaser.GameObjects.Image;

  // Add test mode flag here
  private testMode = true;

  constructor() {
    super('CoinFlipScene');
  }

  preload() {
    this.load.image('coin-heads', '/head.png');
    this.load.image('coin-tails', '/tail.png');
    this.load.image('hand-closed', '/hand-closed.png');
    this.load.image('hand-opened', '/hand-open.png');
    this.load.image('blue-background', '/blue-background.jpg');
  }

  create() {
    const { centerX, centerY } = this.cameras.main;
    this.add.image(centerX, centerY, 'blue-background')
      .setDisplaySize(this.cameras.main.width, this.cameras.main.height * 2)
      .setDepth(-1)
      .setName('background');

    this.hand = this.add.image(centerX - 100, centerY + 50, 'hand-closed')
      .setScale(0.5)
      .setVisible(false);

    this.resultText = this.add.text(centerX, centerY - 300, 'Connecting...', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5).setAlpha(0);

    this.flipButton = this.add.rectangle(centerX, centerY - 200, 160, 50, 0x00aa88)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.onFlip());

    this.flipButtonText = this.add.text(this.flipButton.x, this.flipButton.y, 'Flip Coin', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.retryButton = this.add.rectangle(centerX, centerY + 100, 160, 50, 0xaa0000)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.onRetry())
      .setVisible(false);

    this.retryButtonText = this.add.text(this.retryButton.x, this.retryButton.y, 'Retry', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5).setVisible(false);

    const info = getPlayerInfo();
    this.playerId = info.playerId;
    this.roomId = info.roomId;

    this.animateIntro();
    this.connect();
  }

  connect() {
    if (this.testMode) {
      this.resultText.setText('Offline test mode. Tap Flip!');
      this.resultText.setAlpha(1);
      this.isMyTurn = true;
      this.isOnline = false;
      return;
    }

    connectToServer(this.roomId, this.playerId, (socket, yourTurn) => {
      this.socket = socket;
      this.isMyTurn = yourTurn;
      this.isOnline = true;
      this.resultText.setText(this.isMyTurn ? 'Your turn!' : 'Opponent\'s turn...');
      this.resultText.setAlpha(1);

      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === 'flipResult') {
          this.animateCoin(msg.result);
          this.resultText.setText(`${msg.flipper === this.playerId ? 'You' : 'Opponent'} flipped: ${msg.result.toUpperCase()}`);
          this.isMyTurn = msg.flipper !== this.playerId;
        }
      };
    }, () => {
      this.resultText.setText('Offline test mode. Tap Flip!');
      this.resultText.setAlpha(1);
      this.isMyTurn = true;
      this.isOnline = false;
    });
  }

  onFlip() {
    if (this.flipping || (!this.isOnline && this.isMyTurn === false)) return;

    this.resultText.setAlpha(0);
    this.flipButton.setAlpha(0);
    this.flipButtonText.setAlpha(0);

    const result = Math.random() < 0.5 ? 'heads' : 'tails';

    if (this.isOnline && this.socket) {
      const msg: FlipMessage = {
        type: 'flip',
        room: this.roomId,
        playerId: this.playerId,
        result,
      };
      this.socket.send(JSON.stringify(msg));
      this.isMyTurn = false;
    } else {
      this.animateCoin(result);
      this.resultText.setText(`Test Flip: ${result.toUpperCase()}`);
    }
  }

  onRetry() {
    this.retryButton.setVisible(false);
    this.retryButtonText.setVisible(false);
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    this.flipButton.setAlpha(1);
    this.flipButtonText.setAlpha(1);
    if (this.currentCoin) this.currentCoin.destroy();

    this.hand.setTexture('hand-closed')
      .setPosition(centerX, centerY + 200) // TODO: Fine tune hand position
      .setScale(0.4)
      .setVisible(true)
      .setAlpha(1);

      const coin = this.add.image(centerX + 30, centerY + 60, 'coin-heads') // TODO: Fine tune coin on hand offset
      .setScale(0.5, 0.2) // TODO: Fine tune coin size
      .setAlpha(1);
      this.currentCoin = coin;

    this.resultText.setText(this.isMyTurn
      ? (this.isOnline ? 'Your turn!' : 'Tap Flip!')
      : (this.isOnline ? 'Opponent\'s turn...' : ''));

    this.resultText.setAlpha(1);

  }

  animateIntro() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    if (this.currentCoin) this.currentCoin.destroy();

    this.hand.setTexture('hand-closed')
      .setPosition(centerX, centerY + 200) // TODO: Fine tune hand position
      .setScale(0.4)
      .setVisible(true)
      .setAlpha(0);

    const coin = this.add.image(centerX + 30, centerY + 60, 'coin-heads') // TODO: Fine tune coin on hand offset
      .setScale(0.5, 0.2) // TODO: Fine tune coin size
      .setAlpha(0);

    this.currentCoin = coin;
    this.resultText.setAlpha(0);

    // Fade in all elements together
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 800, // TODO: Fine tune fade duration
      ease: 'Sine.easeOut',
      onUpdate: (tween) => {
        const alpha = tween.getValue();
        this.resultText.setAlpha(alpha || 1);
        this.hand.setAlpha(alpha || 1);
        coin.setAlpha(alpha || 1);
      },
      onComplete: () => {
        this.flipping = false;
      }
    });
  }

  animateCoin(result: 'heads' | 'tails') {
    if (this.currentCoin) this.currentCoin.destroy();
    if (!this.hand) return;
  
    const centerX = this.cameras.main.centerX;
    const startY = this.cameras.main.centerY;
  
    this.resultText.setAlpha(0);
    this.flipButton.setAlpha(0);
    this.flipButtonText.setAlpha(0);
  
    this.hand.setTexture('hand-opened')
      .setPosition(centerX, startY + 200)
      .setScale(0.4)
      .setVisible(true)
      .setAlpha(1);
  
    const coin = this.add.image(centerX, startY + 100, 'coin-heads')
      .setScale(0.5)
      .setDepth(1)
      .setAlpha(1);
  
    this.currentCoin = coin;
    this.flipping = true;
  
    const bg = this.children.getByName('background') as Phaser.GameObjects.Image;
    if (bg) {
      this.tweens.add({
        targets: bg,
        y: startY + 250,
        duration: 1200,
        ease: 'Sine.easeInOut',
        yoyo: true,
      });
    }
  
    this.tweens.add({
      targets: coin,
      angle: 1440,
      duration: 1600,
      y: startY - 300,
      ease: 'Cubic.easeOut',
    });
  
    const flipInterval = 300; // ms between texture switches
    const totalFlips = Math.floor(1600 / flipInterval);
    let flipCount = 0;
  
    const flipTimer = this.time.addEvent({
      delay: flipInterval,
      repeat: totalFlips,
      callback: () => {
        if (!coin) return;
        const isHeads = flipCount % 2 === 0;
        coin.setTexture(isHeads ? 'coin-heads' : 'coin-tails');
        flipCount++;
      }
    });
  
    this.tweens.add({
      targets: coin,
      scaleX: 0.1,
      duration: 200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 7,
    });
  
    this.tweens.add({
      targets: this.hand,
      y: startY + 400,
      duration: 500,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.hand.setAlpha(0);
      }
    });
  
    this.time.delayedCall(1600, () => {
      flipTimer.remove();
  
      this.tweens.add({
        targets: coin,
        y: startY,
        duration: 600,
        ease: 'Sine.easeIn',
        onComplete: () => {
          coin.setTexture(result === 'heads' ? 'coin-heads' : 'coin-tails');
          coin.setAngle(0);
          coin.setScale(0.5);
          this.animateResultText();
  
          this.resultText.setText(`Result: ${result.toUpperCase()}`);
          this.resultText.setAlpha(1);
  
          this.retryButton.setVisible(true);
          this.retryButtonText.setVisible(true);
  
          this.flipping = false;
        }
      });
    });
  }
  
  

  animateResultText() {
    this.resultText.setAlpha(0);
    this.tweens.add({
      targets: this.resultText,
      alpha: 1,
      scale: 1.1,
      duration: 300,
      yoyo: true,
    });
  }
}
