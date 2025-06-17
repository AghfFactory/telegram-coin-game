import Phaser from 'phaser';

export default class CoinFlipScene extends Phaser.Scene {
  private resultText!: Phaser.GameObjects.Text;
  private flipping = false;
  private currentCoin?: Phaser.GameObjects.Image;
  private socket!: WebSocket;
  private playerId = '';
  private roomId = '';
  private isMyTurn = false;

  constructor() {
    super('CoinFlipScene');
  }

  preload() {
    this.load.image('coin-heads', '/head.png');
    this.load.image('coin-tails', '/tail.png');
  }

  create() {
    const { centerX, centerY } = this.cameras.main;

    this.resultText = this.add.text(centerX, centerY - 200, 'Connecting...', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    const flipButton = this.add.rectangle(centerX, centerY + 200, 160, 50, 0x00aa88)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.onFlip());

    this.add.text(flipButton.x, flipButton.y, 'Flip Coin', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.initTelegram();
    this.connectToServer();
  }

  initTelegram() {
    const tg = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    this.playerId = user?.id?.toString() || crypto.randomUUID();

    const params = new URLSearchParams(window.location.search);
    this.roomId = params.get('room') || 'default';
  }

  connectToServer() {
    this.socket = new WebSocket('wss://your-server.com'); // <-- Replace with your WebSocket server

    this.socket.onopen = () => {
      this.socket.send(JSON.stringify({
        type: 'join',
        room: this.roomId,
        playerId: this.playerId
      }));
    };

    this.socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'start') {
        this.isMyTurn = msg.yourTurn;
        this.resultText.setText(this.isMyTurn ? 'Your turn!' : 'Opponent\'s turn...');
      }

      if (msg.type === 'flipResult') {
        this.animateCoin(msg.result);
        this.resultText.setText(`${msg.flipper === this.playerId ? 'You' : 'Opponent'} flipped: ${msg.result.toUpperCase()}`);
        this.isMyTurn = msg.flipper !== this.playerId;
      }
    };
  }

  onFlip() {
    if (!this.isMyTurn || this.flipping) return;

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    this.socket.send(JSON.stringify({
      type: 'flip',
      room: this.roomId,
      playerId: this.playerId,
      result
    }));
    this.isMyTurn = false;
  }

  animateCoin(result: 'heads' | 'tails') {
    if (this.currentCoin) this.currentCoin.destroy();

    const coin = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'coin-heads').setScale(0.5);
    this.currentCoin = coin;

    let halfway = false;
    this.flipping = true;

    this.tweens.add({
      targets: coin,
      angle: 360 * 5,
      scaleX: 0,
      duration: 500,
      ease: 'Quad.easeIn',
      yoyo: true,
      onUpdate: () => {
        if (!halfway && coin.scaleX < 0.05) {
          coin.setTexture(`coin-${result}`);
          halfway = true;
        }
      },
      onComplete: () => {
        this.animateResultText();
        this.flipping = false;
      }
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
