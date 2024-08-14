
/**
 * @swagger
 * components:
 *   schemas:
 *     Coin:
 *       type: object
 *       required:
 *         - account
 *         - amount
 *         - flipType
 *         - strikeNumber
 *         - strikeMultiplier
 *         - houseEdge
 *         - amountWon
 *         - amountLost
 *         - nonce
 *         - gameSeed
 *       properties:
 *         account:
 *           type: string
 *           description: The user account id
 *         amount:
 *           type: number
 *           description: The bet amount for the coin flip
 *         flipType:
 *           type: string
 *           enum: [heads, tails]
 *           description: The side to bet on (heads or tails)
 *         strikeNumber:
 *           type: number
 *           description: The result of the coin flip (1-heads, 2-tails)
 *         strikeMultiplier:
 *           type: number
 *           description: The result multiplier
 *         result:
 *           type: string
 *           enum: [Won, Lost]
 *           description: The result of the coin flip
 *         tokenMint:
 *           type: string
 *           description: The token mint associated with the coin flip
 *         houseEdge:
 *           type: number
 *           description: The house edge for the coin flip
 *         amountWon:
 *           type: number
 *           description: The amount won in the coin flip
 *         amountLost:
 *           type: number
 *           description: The amount lost in the coin flip
 *         nonce:
 *           type: number
 *           description: The nonce for the coin flip
 *         gameSeed:
 *           type: string
 *           description: The id of the user's game seed document
 *       example:
 *         account: "60d0fe4f5311236168a109ca"
 *         amount: 100
 *         flipType: "heads"
 *         strikeNumber: 1
 *         strikeMultiplier: 2
 *         result: "Won"
 *         tokenMint: "someTokenMint"
 *         houseEdge: 0.05
 *         amountWon: 200
 *         amountLost: 0
 *         nonce: 12345
 *         gameSeed: "60d0fe4f5311236168a109cb"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Deposit:
 *       type: object
 *       required:
 *         - account
 *         - wallet
 *         - type
 *         - amount
 *         - tokenMint
 *         - status
 *         - comments
 *       properties:
 *         account:
 *           type: string
 *           description: The user account associated with the deposit
 *         wallet:
 *           type: string
 *           description: The wallet address for the deposit
 *         type:
 *           type: boolean
 *           description: True for deposits, false for withdrawals
 *         amount:
 *           type: number
 *           description: The amount of the deposit
 *           default: 0
 *         tokenMint:
 *           type: string
 *           description: The token mint for the deposit
 *           default: "SOL"
 *         status:
 *           type: string
 *           description: The status of the deposit
 *           enum: ["review", "pending", "completed", "failed"]
 *           default: "completed"
 *         comments:
 *           type: string
 *           description: Additional comments for the deposit
 *           default: "NA"
 *         txnSignature:
 *           type: string
 *           description: The transaction signature for the deposit
 *           unique: true
 *       example:
 *         account: "60d0fe4f5311236168a109ca"
 *         wallet: "someWalletAddress"
 *         type: true
 *         amount: 100
 *         tokenMint: "SOL"
 *         status: "completed"
 *         comments: "NA"
 *         txnSignature: "someUniqueTxnSignature"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Dice:
 *       type: object
 *       required:
 *         - account
 *         - amount
 *         - chosenNumbers
 *         - strikeMultiplier
 *         - houseEdge
 *         - amountWon
 *         - amountLost
 *         - nonce
 *         - gameSeed
 *       properties:
 *         account:
 *           type: string
 *           description: The user account associated with the dice game
 *         amount:
 *           type: number
 *           description: The amount wagered in the dice game
 *         chosenNumbers:
 *           type: array
 *           items:
 *             type: number
 *           description: The numbers chosen by the user (must be whole numbers between 1 and 6)
 *         strikeNumber:
 *           type: number
 *           description: The strike number chosen by the user (must be a whole number between 1 and 6)
 *         strikeMultiplier:
 *           type: number
 *           description: The multiplier applied if the strike number is hit
 *         result:
 *           type: string
 *           enum: ["Won", "Lost"]
 *           description: The result of the dice game
 *         tokenMint:
 *           type: string
 *           description: The token mint used in the dice game
 *         houseEdge:
 *           type: number
 *           description: The house edge percentage for the dice game
 *         amountWon:
 *           type: number
 *           description: The amount won in the dice game
 *         amountLost:
 *           type: number
 *           description: The amount lost in the dice game
 *         nonce:
 *           type: number
 *           description: The nonce value for the dice game
 *         gameSeed:
 *           type: string
 *           description: The game seed associated with the dice game
 *       example:
 *         account: "60d0fe4f5311236168a109ca"
 *         amount: 100
 *         chosenNumbers: [1, 2, 3]
 *         strikeNumber: 4
 *         strikeMultiplier: 2
 *         result: "Won"
 *         tokenMint: "SOL"
 *         houseEdge: 1.5
 *         amountWon: 200
 *         amountLost: 0
 *         nonce: 12345
 *         gameSeed: "60d0fe4f5311236168a109cb"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Dice2:
 *       type: object
 *       required:
 *         - account
 *         - amount
 *         - direction
 *         - chance
 *         - strikeNumber
 *         - strikeMultiplier
 *         - result
 *         - houseEdge
 *         - amountWon
 *         - amountLost
 *         - nonce
 *         - gameSeed
 *       properties:
 *         account:
 *           type: string
 *           description: The user account associated with the dice game
 *         amount:
 *           type: number
 *           description: The amount wagered in the dice game
 *         direction:
 *           type: string
 *           enum: ["over", "under"]
 *           description: The direction chosen by the user
 *         chance:
 *           type: number
 *           description: The chance percentage for the dice game
 *         strikeNumber:
 *           type: number
 *           description: The strike number chosen by the user
 *         strikeMultiplier:
 *           type: number
 *           description: The multiplier applied if the strike number is hit
 *         result:
 *           type: string
 *           enum: ["Won", "Lost"]
 *           description: The result of the dice game
 *         tokenMint:
 *           type: string
 *           description: The token mint used in the dice game
 *         houseEdge:
 *           type: number
 *           description: The house edge percentage for the dice game
 *         amountWon:
 *           type: number
 *           description: The amount won in the dice game
 *         amountLost:
 *           type: number
 *           description: The amount lost in the dice game
 *         nonce:
 *           type: number
 *           description: The nonce value for the dice game
 *         gameSeed:
 *           type: string
 *           description: The game seed associated with the dice game
 *       example:
 *         account: "60d0fe4f5311236168a109ca"
 *         amount: 100
 *         direction: "over"
 *         chance: 50
 *         strikeNumber: 4
 *         strikeMultiplier: 2
 *         result: "Won"
 *         tokenMint: "SOL"
 *         houseEdge: 1.5
 *         amountWon: 200
 *         amountLost: 0
 *         nonce: 12345
 *         gameSeed: "60d0fe4f5311236168a109cb"
 */