import Phaser from 'phaser';
import CoinFlipScene from './Scene/coin-flip';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 400,
  height: 700,
  backgroundColor: '#222831',
  parent: 'game-container',
  scene: [CoinFlipScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
