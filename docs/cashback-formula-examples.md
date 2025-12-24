# Exemples d'utilisation de la formule de calcul du cashback

Ce document explique comment utiliser les nouvelles fonctions de calcul du cashback basées sur la formule fournie.

## Vue d'ensemble

La formule permet de calculer :
1. **Le pourcentage de cashback sur le revenu IB** : `CB_IB = (C / R) × 100`
2. **Le pourcentage de cashback réel** (marketing) : `CB_réel = (C / Coût trader) × 100`

Où :
- **R** = Montant que le broker paie à RendR (ex: 8 $/lot)
- **C** = Montant que RendR reverse au trader
- **Coût trader** = Coût réel par lot pour le trader (basé sur le spread et les commissions)

## Exemples d'utilisation

### Exemple 1 : Calculer les métriques de cashback pour un trade

```typescript
import { calculateCashbackMetrics } from '@/lib/utils/broker-cashback';

// Pour un trade de 2.5 lots sur EUR/USD avec Vantage
const metrics = calculateCashbackMetrics('Vantage', 'EURUSD', 2.5, 0.5);

console.log(metrics);
// {
//   brokerRevenue: 20,        // R : 8$/lot × 2.5 lots = 20$
//   cashbackAmount: 10,       // C : 20$ × 50% = 10$
//   cashbackOnIBRevenue: 50,  // 10 / 20 × 100 = 50%
//   traderCostPerLot: 10,     // 1.0 pip × 10 = 10$/lot
//   realCashbackPercentage: 40 // 10$ / (10$ × 2.5) × 100 = 40%
// }
```

### Exemple 2 : Configurer un nouveau broker

```typescript
import { calculateCashbackForNewBroker } from '@/lib/utils/broker-cashback';

// Configuration pour IC Markets Standard
// - Spread moyen EUR/USD : 0.9 pips
// - Revenu IB : 7 $/lot
// - Partage : 50%
const config = calculateCashbackForNewBroker(
  0.9,      // spread moyen en pips
  7,        // revenu IB par lot
  0.5,      // 50% de partage
  'standard' // type de compte
);

console.log(config);
// {
//   cashbackPerLot: 3.5,           // 7 × 0.5 = 3.5$/lot
//   traderCostPerLot: 9,            // 0.9 × 10 = 9$/lot
//   realCashbackPercentage: 38.89,  // 3.5 / 9 × 100 ≈ 38.89%
//   cashbackOnIBRevenue: 50         // 3.5 / 7 × 100 = 50%
// }
```

### Exemple 3 : Configurer un broker avec compte ECN

```typescript
import { calculateCashbackForNewBroker } from '@/lib/utils/broker-cashback';

// Configuration pour un broker ECN avec commission
const config = calculateCashbackForNewBroker(
  0.6,      // spread moyen en pips
  8,        // revenu IB par lot
  0.5,      // 50% de partage
  'ecn',    // type de compte ECN
  3.5       // commission round-turn en USD
);

console.log(config);
// {
//   cashbackPerLot: 4,              // 8 × 0.5 = 4$/lot
//   traderCostPerLot: 9.5,           // (0.6 × 10) + 3.5 = 9.5$/lot
//   realCashbackPercentage: 42.11,   // 4 / 9.5 × 100 ≈ 42.11%
//   cashbackOnIBRevenue: 50          // 4 / 8 × 100 = 50%
// }
```

### Exemple 4 : Calculer le coût réel du trader

```typescript
import { calculateTraderCostPerLot } from '@/lib/utils/broker-cashback';

// Pour IC Markets (spread 0.9 pips, compte standard)
const cost = calculateTraderCostPerLot('IC Markets');
console.log(cost); // 9 (0.9 × 10 = 9$/lot)

// Pour un broker non configuré
const unknownCost = calculateTraderCostPerLot('Unknown Broker');
console.log(unknownCost); // null
```

### Exemple 5 : Calculer le pourcentage de cashback réel (marketing)

```typescript
import {
  calculateRealCashbackPercentage,
  calculateCashbackOnIBRevenue
} from '@/lib/utils/broker-cashback';

// Exemple : Broker A
// - Coût moyen : 6 $/lot
// - Cashback : 4 $/lot
const cashbackA = 4;
const costA = 6;
const percentageA = calculateRealCashbackPercentage(cashbackA, costA);
console.log(percentageA); // 66.67% (4 / 6 × 100)

// Exemple : Broker B
// - Coût moyen : 9 $/lot
// - Cashback : 4 $/lot
const cashbackB = 4;
const costB = 9;
const percentageB = calculateRealCashbackPercentage(cashbackB, costB);
console.log(percentageB); // 44.44% (4 / 9 × 100)
```

## Configuration des brokers

Pour ajouter un nouveau broker dans la configuration, modifiez `BROKER_COST_CONFIG` dans `src/lib/utils/broker-cashback.ts` :

```typescript
export const BROKER_COST_CONFIG: Record<string, BrokerCostConfig> = {
  'IC Markets': {
    spreadPips: 0.9,
    accountType: 'standard'
  },
  'Vantage': {
    spreadPips: 1.0,
    accountType: 'standard'
  },
  'Nouveau Broker': {
    spreadPips: 0.8,
    commissionRoundTurn: 3.5, // Optionnel, pour comptes ECN
    accountType: 'ecn'
  }
};
```

## Formules détaillées

### 1. Coût du trader (Standard/STP)
```
Coût trader = Spread (en pips) × 10 dollars
```

### 2. Coût du trader (ECN)
```
Coût trader = (Spread en pips × 10) + Commission round-turn
```

### 3. Pourcentage de cashback sur revenu IB
```
CB_IB = (C / R) × 100
```

### 4. Pourcentage de cashback réel (marketing)
```
CB_réel = (C / Coût trader) × 100
```

## Notes importantes

- Le spread doit être mesuré sur le compte Standard/STP du broker
- Pour les comptes ECN, inclure la commission round-turn dans le calcul
- Le pourcentage de cashback réel est plus "marketing" car il montre combien du coût réel est remboursé
- Le pourcentage de cashback sur revenu IB montre la part du revenu IB reversée au trader


