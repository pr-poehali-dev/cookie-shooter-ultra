import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';

type GameScreen = 'menu' | 'characters' | 'game' | 'shop' | 'leaderboard';

interface Character {
  id: number;
  name: string;
  image: string;
  speed: number;
  power: number;
  health: number;
  unlocked: boolean;
}

interface Weapon {
  id: number;
  name: string;
  icon: string;
  damage: number;
  fireRate: number;
  price: number;
  owned: boolean;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  emoji: string;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  weaponId: number;
}

const Index = () => {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [currentWeapon, setCurrentWeapon] = useState<Weapon | null>(null);
  const [coins, setCoins] = useState(500);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [stylePoints, setStylePoints] = useState(0);
  const [lastWeaponUsed, setLastWeaponUsed] = useState<number | null>(null);
  const [killStreak, setKillStreak] = useState(0);
  const [comboTimer, setComboTimer] = useState(0);
  const [comboRank, setComboRank] = useState('');
  const [playerX, setPlayerX] = useState(10);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerY, setPlayerY] = useState(50);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [distance, setDistance] = useState(0);
  const gameLoopRef = useRef<number>();

  const characters: Character[] = [
    { id: 1, name: 'V1 Machine', image: 'https://cdn.poehali.dev/projects/5fcf8f3f-b77e-4b1f-ba3e-55f65eb3f892/files/26e61209-44a9-4828-b74a-2646b11d94d6.jpg', speed: 5, power: 3, health: 100, unlocked: true },
    { id: 2, name: 'Heavy Assault', image: 'https://cdn.poehali.dev/projects/5fcf8f3f-b77e-4b1f-ba3e-55f65eb3f892/files/1a5161e2-ff13-4d6d-9d7c-104ccbe49e10.jpg', speed: 4, power: 5, health: 120, unlocked: true },
    { id: 3, name: 'Speed Demon', image: 'https://cdn.poehali.dev/projects/5fcf8f3f-b77e-4b1f-ba3e-55f65eb3f892/files/26e61209-44a9-4828-b74a-2646b11d94d6.jpg', speed: 6, power: 4, health: 90, unlocked: false },
    { id: 4, name: 'Tank Bot', image: 'https://cdn.poehali.dev/projects/5fcf8f3f-b77e-4b1f-ba3e-55f65eb3f892/files/1a5161e2-ff13-4d6d-9d7c-104ccbe49e10.jpg', speed: 5, power: 6, health: 110, unlocked: false },
  ];

  const [weapons, setWeapons] = useState<Weapon[]>([
    { id: 1, name: 'Sprinkle Shot', icon: '✨', damage: 10, fireRate: 500, price: 0, owned: true },
    { id: 2, name: 'Chocolate Blast', icon: '🍫', damage: 20, fireRate: 700, price: 200, owned: false },
    { id: 3, name: 'Rainbow Beam', icon: '🌈', damage: 30, fireRate: 600, price: 500, owned: false },
    { id: 4, name: 'Candy Cannon', icon: '🍭', damage: 50, fireRate: 1000, price: 1000, owned: false },
  ]);

  const enemyEmojis = ['👾', '👹', '👿', '💀', '🤖'];

  useEffect(() => {
    if (!currentWeapon && weapons[0]) {
      setCurrentWeapon(weapons[0]);
    }
  }, [weapons, currentWeapon]);

  useEffect(() => {
    if (!isPlaying) return;

    const gameLoop = () => {
      setDistance(d => d + 1);
      
      setComboTimer(prev => {
        const newTimer = prev - 0.016;
        if (newTimer <= 0) {
          setKillStreak(0);
          setComboRank('');
          return 0;
        }
        return newTimer;
      });
      
      if (Math.random() < 0.02) {
        const newEnemy: Enemy = {
          id: Date.now(),
          x: 100,
          y: Math.random() * 80 + 10,
          health: 30,
          emoji: enemyEmojis[Math.floor(Math.random() * enemyEmojis.length)]
        };
        setEnemies(prev => [...prev, newEnemy]);
      }

      setEnemies(prev => prev
        .map(e => ({ ...e, x: e.x - 2 }))
        .filter(e => e.x > -10 && e.health > 0)
      );

      setBullets(prev => prev
        .map(b => ({ ...b, x: b.x + 4 }))
        .filter(b => b.x < 110)
      );

      setEnemies(prev => {
        const updated = [...prev];
        const weaponsUsed = new Set<number>();
        
        bullets.forEach(bullet => {
          const hitEnemy = updated.find(e => 
            Math.abs(e.x - bullet.x) < 5 && 
            Math.abs(e.y - bullet.y) < 5
          );
          if (hitEnemy && currentWeapon) {
            weaponsUsed.add(bullet.weaponId);
            hitEnemy.health -= currentWeapon.damage;
            if (hitEnemy.health <= 0) {
              setScore(s => s + 10);
              setKillStreak(k => {
                const newStreak = k + 1;
                
                if (newStreak >= 20) setComboRank('ULTRAKILL');
                else if (newStreak >= 15) setComboRank('SUPREME');
                else if (newStreak >= 10) setComboRank('DESTRUCTIVE');
                else if (newStreak >= 7) setComboRank('BRUTAL');
                else if (newStreak >= 5) setComboRank('CARNAGE');
                else if (newStreak >= 3) setComboRank('SAVAGE');
                else setComboRank('');
                
                return newStreak;
              });
              
              setComboTimer(3);
              
              const varietyBonus = weaponsUsed.size > 1 ? 15 : 10;
              const streakBonus = Math.floor(killStreak / 3) * 5;
              const totalStyle = varietyBonus + streakBonus;
              
              setStylePoints(prev => prev + totalStyle);
            }
          }
        });
        return updated.filter(e => e.health > 0);
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isPlaying, bullets, currentWeapon]);

  const startGame = () => {
    if (!selectedCharacter) return;
    setIsPlaying(true);
    setScore(0);
    setDistance(0);
    setEnemies([]);
    setBullets([]);
    setPlayerY(50);
    setPlayerX(10);
    setStylePoints(0);
    setKillStreak(0);
    setComboTimer(0);
    setComboRank('');
    setLastWeaponUsed(null);
    setScreen('game');
  };

  const endGame = () => {
    setIsPlaying(false);
    if (score > highScore) setHighScore(score);
    setScreen('menu');
  };

  const shoot = () => {
    if (!currentWeapon) return;
    
    let styleBonus = 1;
    if (lastWeaponUsed && lastWeaponUsed !== currentWeapon.id) {
      styleBonus = 2;
      setStylePoints(prev => prev + 5);
    }
    setLastWeaponUsed(currentWeapon.id);
    
    const newBullet: Bullet = {
      id: Date.now(),
      x: playerX + 5,
      y: playerY,
      weaponId: currentWeapon.id
    };
    setBullets(prev => [...prev, newBullet]);
    setStylePoints(prev => prev + styleBonus);
  };

  const buyWeapon = (weapon: Weapon) => {
    if (stylePoints >= weapon.price && !weapon.owned) {
      setStylePoints(stylePoints - weapon.price);
      setWeapons(weapons.map(w => 
        w.id === weapon.id ? { ...w, owned: true } : w
      ));
    }
  };

  const selectCharacter = (char: Character) => {
    if (char.unlocked) {
      setSelectedCharacter(char);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-game-pink via-game-purple to-game-blue flex items-center justify-center p-4">
      {screen === 'menu' && (
        <div className="max-w-2xl w-full animate-bounce-in">
          <Card className="p-8 game-card bg-white/95 backdrop-blur cookie-shadow">
            <div className="text-center mb-8">
              <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text rainbow-gradient animate-float">
                ULTRARUN
              </h1>
              <p className="text-2xl text-gray-700">🔫 STYLE. SPEED. DESTRUCTION. 🔥</p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={() => selectedCharacter ? startGame() : setScreen('characters')}
                className="w-full h-16 text-2xl font-bold rainbow-gradient hover:opacity-90 cookie-shadow text-white"
              >
                <Icon name="Play" className="mr-2" size={32} />
                {selectedCharacter ? 'СТАРТ!' : 'ВЫБРАТЬ ГЕРОЯ'}
              </Button>

              <Button 
                onClick={() => setScreen('characters')}
                className="w-full h-14 text-xl font-semibold bg-game-lightred hover:bg-game-red text-white cookie-shadow border-2 border-game-black"
              >
                <Icon name="Users" className="mr-2" size={24} />
                ПЕРСОНАЖИ
              </Button>

              <Button 
                onClick={() => setScreen('shop')}
                className="w-full h-14 text-xl font-semibold bg-game-black hover:bg-gray-700 text-game-lightred cookie-shadow border-2 border-game-red"
              >
                <Icon name="ShoppingCart" className="mr-2" size={24} />
                МАГАЗИН
              </Button>

              <Button 
                onClick={() => setScreen('leaderboard')}
                className="w-full h-14 text-xl font-semibold red-black-gradient hover:opacity-90 text-white cookie-shadow"
              >
                <Icon name="Trophy" className="mr-2" size={24} />
                РЕКОРДЫ
              </Button>
            </div>

            <div className="mt-8 flex justify-around text-center">
              <div>
                <div className="text-3xl font-bold text-game-red">🔥 {stylePoints}</div>
                <div className="text-sm text-gray-600">Стиль</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-game-pink">🏆 {highScore}</div>
                <div className="text-sm text-gray-600">Рекорд</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {screen === 'characters' && (
        <div className="max-w-4xl w-full animate-bounce-in">
          <Card className="p-8 game-card bg-white/95 backdrop-blur cookie-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-4xl font-bold text-gray-900">ВЫБЕРИ ГЕРОЯ</h2>
              <Button onClick={() => setScreen('menu')} variant="outline" size="lg">
                <Icon name="ArrowLeft" className="mr-2" />
                Назад
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {characters.map(char => (
                <Card 
                  key={char.id}
                  className={`p-6 cursor-pointer transition-all hover:scale-105 ${
                    selectedCharacter?.id === char.id 
                      ? 'ring-4 ring-game-red cookie-shadow' 
                      : 'hover:ring-2 ring-game-lightred'
                  } ${!char.unlocked ? 'opacity-50' : ''}`}
                  onClick={() => selectCharacter(char)}
                >
                  <div className="text-center">
                    <img src={char.image} alt={char.name} className="w-32 h-32 mx-auto mb-3 object-contain animate-float" />
                    <h3 className="text-xl font-bold mb-3">{char.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Скорость:</span>
                        <Progress value={char.speed * 20} className="w-24 h-2" />
                      </div>
                      <div className="flex justify-between">
                        <span>Сила:</span>
                        <Progress value={char.power * 20} className="w-24 h-2" />
                      </div>
                      <div className="flex justify-between">
                        <span>Здоровье:</span>
                        <Progress value={char.health} className="w-24 h-2" />
                      </div>
                    </div>
                    {!char.unlocked && (
                      <div className="mt-3 text-game-yellow font-bold">🔒 Закрыт</div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {selectedCharacter && (
              <Button 
                onClick={startGame}
                className="w-full mt-6 h-16 text-2xl font-bold rainbow-gradient hover:opacity-90 cookie-shadow text-white"
              >
                НАЧАТЬ ИГРУ!
              </Button>
            )}
          </Card>
        </div>
      )}

      {screen === 'game' && (
        <div className="w-full max-w-6xl">
          <div className="bg-white/95 rounded-3xl p-4 mb-4 flex justify-between items-center cookie-shadow">
            <div className="flex gap-6">
              <div className="text-xl font-bold">🔥 {stylePoints}</div>
              <div className="text-xl font-bold">⭐ {score}</div>
              <div className="text-xl font-bold">📏 {Math.floor(distance / 10)}m</div>
            </div>
            <Button onClick={endGame} variant="destructive" size="lg">
              <Icon name="X" className="mr-2" />
              Завершить
            </Button>
          </div>

          <div 
            className="relative bg-gradient-to-r from-red-900 via-gray-900 to-black rounded-3xl cookie-shadow overflow-hidden"
            style={{ height: '600px' }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setPlayerX(Math.max(5, Math.min(30, x)));
              setPlayerY(Math.max(10, Math.min(90, y)));
            }}
          >
            {comboRank && (
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
                <div className="text-6xl font-bold text-game-red animate-bounce-in" style={{ textShadow: '0 0 20px #DC2626, 0 0 40px #DC2626' }}>
                  {comboRank}
                </div>
                <div className="text-3xl font-bold text-white text-center mt-2">
                  {killStreak}x COMBO
                </div>
                <div className="w-64 h-2 bg-gray-800 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-game-red transition-all duration-100"
                    style={{ width: `${(comboTimer / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <img 
              src={selectedCharacter?.image}
              alt="player"
              className="absolute w-24 h-24 object-contain transition-all duration-100"
              style={{ 
                left: `${playerX}%`, 
                top: `${playerY}%`,
                transform: 'translate(-50%, -50%)',
                filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))'
              }}
            />

            {bullets.map(bullet => (
              <div
                key={bullet.id}
                className="absolute text-2xl"
                style={{
                  left: `${bullet.x}%`,
                  top: `${bullet.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {currentWeapon?.icon}
              </div>
            ))}

            {enemies.map(enemy => (
              <div
                key={enemy.id}
                className="absolute text-5xl animate-slide-left"
                style={{
                  left: `${enemy.x}%`,
                  top: `${enemy.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {enemy.emoji}
              </div>
            ))}

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
              <Button 
                onClick={shoot}
                size="lg"
                className="h-20 w-20 rounded-full rainbow-gradient hover:opacity-90 cookie-shadow text-white"
              >
                <Icon name="Zap" size={40} />
              </Button>
            </div>
          </div>

          <div className="mt-4 text-center text-white text-lg font-bold bg-black/50 rounded-2xl p-3">
            🎯 Двигай мышью для управления • ⚡ Жми кнопку для стрельбы • 🔄 Меняй оружие для бонуса
          </div>
        </div>
      )}

      {screen === 'shop' && (
        <div className="max-w-4xl w-full animate-bounce-in">
          <Card className="p-8 game-card bg-white/95 backdrop-blur cookie-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-4xl font-bold text-gray-900">МАГАЗИН ОРУЖИЯ</h2>
                <p className="text-xl text-gray-600 mt-2">🔥 У тебя: {stylePoints} стиля</p>
              </div>
              <Button onClick={() => setScreen('menu')} variant="outline" size="lg">
                <Icon name="ArrowLeft" className="mr-2" />
                Назад
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {weapons.map(weapon => (
                <Card 
                  key={weapon.id}
                  className={`p-6 ${
                    currentWeapon?.id === weapon.id 
                      ? 'ring-4 ring-game-red cookie-shadow' 
                      : ''
                  }`}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-3">{weapon.icon}</div>
                    <h3 className="text-xl font-bold mb-3">{weapon.name}</h3>
                    <div className="space-y-2 text-sm mb-4">
                      <div>💥 Урон: {weapon.damage}</div>
                      <div>⚡ Скорость: {1000 / weapon.fireRate}/сек</div>
                    </div>
                    {weapon.owned ? (
                      <Button 
                        onClick={() => setCurrentWeapon(weapon)}
                        className="w-full bg-game-lightred hover:bg-game-red text-white border-2 border-game-black"
                        disabled={currentWeapon?.id === weapon.id}
                      >
                        {currentWeapon?.id === weapon.id ? '✓ Выбрано' : 'Выбрать'}
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => buyWeapon(weapon)}
                        className="w-full rainbow-gradient hover:opacity-90 text-white"
                        disabled={stylePoints < weapon.price}
                      >
                        Купить за 🔥 {weapon.price}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}

      {screen === 'leaderboard' && (
        <div className="max-w-2xl w-full animate-bounce-in">
          <Card className="p-8 game-card bg-white/95 backdrop-blur cookie-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-4xl font-bold text-gray-900">🏆 РЕКОРДЫ</h2>
              <Button onClick={() => setScreen('menu')} variant="outline" size="lg">
                <Icon name="ArrowLeft" className="mr-2" />
                Назад
              </Button>
            </div>

            <div className="space-y-4">
              <Card className="p-6 red-black-gradient">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">🥇</div>
                    <div>
                      <div className="text-2xl font-bold">Твой рекорд</div>
                      <div className="text-lg">Счёт: {highScore}</div>
                    </div>
                  </div>
                  <div className="text-4xl font-bold">{highScore}</div>
                </div>
              </Card>

              <div className="text-center text-gray-600 py-8">
                <Icon name="Trophy" size={64} className="mx-auto mb-4 text-game-yellow" />
                <p className="text-xl">Продолжай играть, чтобы побить рекорд!</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Index;