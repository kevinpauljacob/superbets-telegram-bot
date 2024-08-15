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

/**
 * @swagger
 * components:
 *   schemas:
 *     GameSeed:
 *       type: object
 *       required:
 *         - account
 *         - serverSeed
 *         - serverSeedHash
 *         - iv
 *         - nonce
 *         - status
 *         - pendingMines
 *       properties:
 *         account:
 *           type: string
 *           description: The user account associated with the game seed.
 *         clientSeed:
 *           type: string
 *           description: The client seed used for generating the game seed.
 *         serverSeed:
 *           type: string
 *           description: The server seed used for generating the game seed.
 *           unique: true
 *           required: true
 *         serverSeedHash:
 *           type: string
 *           description: The hash of the server seed.
 *           required: true
 *         iv:
 *           type: string
 *           description: The initialization vector used in the seed generation process.
 *           required: true
 *         nonce:
 *           type: number
 *           description: The nonce used in the seed generation process.
 *           required: true
 *           default: 0
 *         status:
 *           type: string
 *           description: The status of the game seed.
 *           required: true
 *           enum: ["NEXT", "CURRENT", "PREVIOUS"]
 *           default: "NEXT"
 *         pendingMines:
 *           type: boolean
 *           description: Indicates if there are any pending mines for this game seed.
 *           required: true
 *           default: false
 *       example:
 *         account: "60d0fe4f5311236168a109ca"
 *         clientSeed: "someClientSeed"
 *         serverSeed: "someServerSeed"
 *         serverSeedHash: "someServerSeedHash"
 *         iv: "someInitializationVector"
 *         nonce: 12345
 *         status: "NEXT"
 *         pendingMines: false
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     GameStats:
 *       type: object
 *       required:
 *         - game
 *         - numOfWallets
 *       properties:
 *         game:
 *           type: string
 *           description: The name of the game.
 *           unique: true
 *           required: true
 *         volume:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: A map containing the volume of transactions per token type.
 *         feeGenerated:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: A map containing the fees generated per token type.
 *         numOfWallets:
 *           type: number
 *           description: The number of unique wallets that participated in the game.
 *           required: true
 *           default: 0
 *       example:
 *         game: "CoinFlip"
 *         volume:
 *           SOL: 1000
 *           USDC: 500
 *         feeGenerated:
 *           SOL: 10
 *           USDC: 5
 *         numOfWallets: 150
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     GameUser:
 *       type: object
 *       required:
 *         - wallet
 *         - privateKey
 *         - iv
 *         - name
 *         - email
 *         - deposit
 *         - numOfGamesPlayed
 *         - gamesPlayed
 *         - isWeb2User
 *       properties:
 *         wallet:
 *           type: string
 *           description: The user's wallet address.
 *           unique: true
 *         privateKey:
 *           type: string
 *           description: The private key for the user's wallet.
 *           unique: true
 *         iv:
 *           type: string
 *           description: Initialization vector for encryption.
 *           required: true
 *         name:
 *           type: string
 *           description: The user's name.
 *           sparse: true
 *         email:
 *           type: string
 *           description: The user's email address.
 *           unique: true
 *         image:
 *           type: string
 *           description: URL to the user's profile image.
 *           sparse: true
 *         deposit:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: The amount deposited by the user.
 *                 default: 0
 *                 minimum: 0
 *               tokenMint:
 *                 type: string
 *                 description: The token mint used for the deposit.
 *                 default: "SOL"
 *               depositAmount:
 *                 type: number
 *                 description: The amount deposited.
 *                 default: 0
 *                 minimum: 0
 *               interestEarned:
 *                 type: number
 *                 description: The interest earned on the deposit.
 *                 default: 0
 *                 minimum: 0
 *         isOptionOngoing:
 *           type: boolean
 *           description: Indicates if there is an ongoing option for the user.
 *           default: false
 *         sns:
 *           type: string
 *           description: The social networking service associated with the user.
 *         numOfGamesPlayed:
 *           type: number
 *           description: The number of games the user has played.
 *           default: 0
 *         gamesPlayed:
 *           type: array
 *           items:
 *             type: string
 *           description: The list of games played by the user.
 *           default: []
 *         isWeb2User:
 *           type: boolean
 *           description: Indicates if the user is a Web2 user.
 *           default: true
 *         isUSDCClaimed:
 *           type: boolean
 *           description: Indicates if the user has claimed USDC.
 *           default: false
 *         claimCount:
 *           type: number
 *           description: The count of USDC claims made by the user.
 *           unique: true
 *           sparse: true
 *       example:
 *         wallet: "someWalletAddress"
 *         privateKey: "somePrivateKey"
 *         iv: "someIvValue"
 *         name: "John Doe"
 *         email: "johndoe@example.com"
 *         image: "https://example.com/profile.jpg"
 *         deposit:
 *           - amount: 100
 *             tokenMint: "SOL"
 *             depositAmount: 100
 *             interestEarned: 5
 *         isOptionOngoing: false
 *         sns: "@johndoe"
 *         numOfGamesPlayed: 10
 *         gamesPlayed: ["CoinFlip", "Dice"]
 *         isWeb2User: true
 *         isUSDCClaimed: false
 *         claimCount: 1
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Keno:
 *       type: object
 *       required:
 *         - account
 *         - amount
 *         - risk
 *         - chosenNumbers
 *         - strikeNumbers
 *         - strikeMultiplier
 *         - houseEdge
 *         - result
 *         - amountWon
 *         - amountLost
 *         - nonce
 *         - gameSeed
 *       properties:
 *         account:
 *           type: string
 *           description: The user account ID.
 *         amount:
 *           type: number
 *           description: The amount wagered in the Keno game.
 *         risk:
 *           type: string
 *           enum: ["classic", "low", "medium", "high"]
 *           description: The risk level of the Keno game.
 *         chosenNumbers:
 *           type: array
 *           items:
 *             type: number
 *           description: The numbers chosen by the user for the Keno game.
 *         strikeNumbers:
 *           type: array
 *           items:
 *             type: number
 *           description: The numbers that were drawn in the Keno game.
 *         strikeMultiplier:
 *           type: number
 *           description: The multiplier applied if the strike numbers are hit.
 *         tokenMint:
 *           type: string
 *           description: The token mint used in the Keno game.
 *         houseEdge:
 *           type: number
 *           description: The house edge percentage for the Keno game.
 *         result:
 *           type: string
 *           enum: ["Won", "Lost"]
 *           description: The result of the Keno game.
 *         amountWon:
 *           type: number
 *           description: The amount won in the Keno game.
 *         amountLost:
 *           type: number
 *           description: The amount lost in the Keno game.
 *         nonce:
 *           type: number
 *           description: The nonce value for the Keno game.
 *         gameSeed:
 *           type: string
 *           description: The ID of the game seed document.
 *       example:
 *         account: "60d0fe4f5311236168a109ca"
 *         amount: 100
 *         risk: "medium"
 *         chosenNumbers: [5, 12, 23, 34, 45]
 *         strikeNumbers: [5, 12, 23]
 *         strikeMultiplier: 3
 *         tokenMint: "SOL"
 *         houseEdge: 0.05
 *         result: "Won"
 *         amountWon: 300
 *         amountLost: 0
 *         nonce: 123456
 *         gameSeed: "60d0fe4f5311236168a109cb"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Limbo:
 *       type: object
 *       required:
 *         - account
 *         - amount
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
 *           description: The user account ID.
 *         amount:
 *           type: number
 *           description: The amount wagered in the Limbo game.
 *         chance:
 *           type: number
 *           description: The chance percentage for the Limbo game.
 *         strikeNumber:
 *           type: number
 *           description: The strike number chosen by the user.
 *         strikeMultiplier:
 *           type: number
 *           description: The multiplier applied if the strike number is hit.
 *         result:
 *           type: string
 *           enum: ["Won", "Lost"]
 *           description: The result of the Limbo game.
 *         tokenMint:
 *           type: string
 *           description: The token mint used in the Limbo game.
 *         houseEdge:
 *           type: number
 *           description: The house edge percentage for the Limbo game.
 *         amountWon:
 *           type: number
 *           description: The amount won in the Limbo game.
 *         amountLost:
 *           type: number
 *           description: The amount lost in the Limbo game.
 *         nonce:
 *           type: number
 *           description: The nonce value for the Limbo game.
 *         gameSeed:
 *           type: string
 *           description: The ID of the game seed document.
 *       example:
 *         account: "60d0fe4f5311236168a109ca"
 *         amount: 100
 *         chance: 50
 *         strikeNumber: 10
 *         strikeMultiplier: 2
 *         result: "Won"
 *         tokenMint: "SOL"
 *         houseEdge: 0.05
 *         amountWon: 200
 *         amountLost: 0
 *         nonce: 123456
 *         gameSeed: "60d0fe4f5311236168a109cb"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Mines:
 *       type: object
 *       required:
 *         - account
 *         - amount
 *         - minesCount
 *         - userBets
 *         - strikeNumbers
 *         - strikeMultiplier
 *         - result
 *         - amountWon
 *         - amountLost
 *         - nonce
 *         - gameSeed
 *       properties:
 *         account:
 *           type: string
 *           description: The user account ID.
 *         amount:
 *           type: number
 *           description: The amount wagered in the Mines game.
 *         minesCount:
 *           type: number
 *           description: The number of mines in the Mines game.
 *         userBets:
 *           type: array
 *           items:
 *             type: number
 *           description: The numbers chosen by the user in the Mines game.
 *         strikeNumbers:
 *           type: array
 *           items:
 *             type: number
 *           description: The numbers that were drawn in the Mines game.
 *         strikeMultiplier:
 *           type: number
 *           description: The multiplier applied if the strike numbers are hit.
 *         tokenMint:
 *           type: string
 *           description: The token mint used in the Mines game.
 *         houseEdge:
 *           type: number
 *           description: The house edge percentage for the Mines game.
 *         result:
 *           type: string
 *           enum: ["Won", "Lost", "Pending"]
 *           description: The result of the Mines game.
 *         amountWon:
 *           type: number
 *           description: The amount won in the Mines game.
 *         amountLost:
 *           type: number
 *           description: The amount lost in the Mines game.
 *         nonce:
 *           type: number
 *           description: The nonce value for the Mines game.
 *         gameSeed:
 *           type: string
 *           description: The ID of the game seed document.
 *       example:
 *         account: "60d0fe4f5311236168a109ca"
 *         amount: 100
 *         minesCount: 10
 *         userBets: [1, 2, 3, 4]
 *         strikeNumbers: [2, 4]
 *         strikeMultiplier: 3
 *         tokenMint: "SOL"
 *         houseEdge: 0.05
 *         result: "Won"
 *         amountWon: 300
 *         amountLost: 0
 *         nonce: 123456
 *         gameSeed: "60d0fe4f5311236168a109cb"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Option:
 *       type: object
 *       required:
 *         - account
 *         - amount
 *         - betType
 *         - strikeMultiplier
 *         - timeFrame
 *         - amountWon
 *         - amountLost
 *       properties:
 *         account:
 *           type: string
 *           description: The user account ID.
 *         betTime:
 *           type: string
 *           format: date-time
 *           description: The time when the bet was placed.
 *         betEndTime:
 *           type: string
 *           format: date-time
 *           description: The time when the bet ended.
 *         amount:
 *           type: number
 *           description: The amount wagered in the Option game.
 *         betType:
 *           type: string
 *           enum: ["betUp", "betDown"]
 *           description: The type of bet placed.
 *         strikeMultiplier:
 *           type: number
 *           description: The multiplier applied if the strike is successful.
 *         strikePrice:
 *           type: number
 *           description: The price at which the strike occurs.
 *         betEndPrice:
 *           type: number
 *           description: The price at the end of the bet period.
 *         timeFrame:
 *           type: number
 *           description: The time frame for the bet in seconds.
 *         result:
 *           type: string
 *           enum: ["Pending", "Won", "Lost"]
 *           description: The result of the bet.
 *         tokenMint:
 *           type: string
 *           description: The token mint used in the Option game.
 *         houseEdge:
 *           type: number
 *           description: The house edge percentage.
 *         amountWon:
 *           type: number
 *           description: The amount won in the Option game.
 *         amountLost:
 *           type: number
 *           description: The amount lost in the Option game.
 *       example:
 *         account: "60d0fe4f5311236168a109ca"
 *         betTime: "2024-08-14T12:34:56Z"
 *         betEndTime: "2024-08-14T12:44:56Z"
 *         amount: 100
 *         betType: "betUp"
 *         strikeMultiplier: 2
 *         strikePrice: 1500
 *         betEndPrice: 1600
 *         timeFrame: 300
 *         result: "Pending"
 *         tokenMint: "SOL"
 *         houseEdge: 0.05
 *         amountWon: 200
 *         amountLost: 0
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Plinko:
 *       type: object
 *       required:
 *         - account
 *         - amount
 *         - risk
 *         - rows
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
 *           description: The user account ID.
 *         amount:
 *           type: number
 *           description: The amount wagered in the Plinko game.
 *         risk:
 *           type: string
 *           enum: ["low", "medium", "high"]
 *           description: The risk level chosen for the Plinko game.
 *         rows:
 *           type: number
 *           description: The number of rows in the Plinko game.
 *         strikeNumber:
 *           type: number
 *           description: The strike number in the Plinko game.
 *         strikeMultiplier:
 *           type: number
 *           description: The multiplier applied if the strike number is hit.
 *         tokenMint:
 *           type: string
 *           description: The token mint used in the Plinko game.
 *         houseEdge:
 *           type: number
 *           description: The house edge percentage for the Plinko game.
 *         result:
 *           type: string
 *           enum: ["Won", "Lost"]
 *           description: The result of the Plinko game.
 *         amountWon:
 *           type: number
 *           description: The amount won in the Plinko game.
 *         amountLost:
 *           type: number
 *           description: The amount lost in the Plinko game.
 *         nonce:
 *           type: number
 *           description: The nonce value for the Plinko game.
 *         gameSeed:
 *           type: string
 *           description: The ID of the game seed document.
 *       example:
 *         account: "60d0fe4f5311236168a109ca"
 *         amount: 100
 *         risk: "medium"
 *         rows: 10
 *         strikeNumber: 5
 *         strikeMultiplier: 3
 *         tokenMint: "SOL"
 *         houseEdge: 0.05
 *         result: "Won"
 *         amountWon: 300
 *         amountLost: 0
 *         nonce: 123456
 *         gameSeed: "60d0fe4f5311236168a109cb"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Roulette1:
 *       type: object
 *       required:
 *         - account
 *         - amount
 *         - wager
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
 *           description: The user account ID.
 *         amount:
 *           type: number
 *           description: The amount wagered in the Roulette game.
 *         wager:
 *           type: object
 *           description: The wager details in the Roulette game.
 *         strikeNumber:
 *           type: number
 *           description: The strike number in the Roulette game.
 *         strikeMultiplier:
 *           type: number
 *           description: The multiplier applied if the strike number is hit.
 *         result:
 *           type: string
 *           enum: ["Won", "Lost"]
 *           description: The result of the Roulette game.
 *         tokenMint:
 *           type: string
 *           description: The token mint used in the Roulette game.
 *         houseEdge:
 *           type: number
 *           description: The house edge percentage for the Roulette game.
 *         amountWon:
 *           type: number
 *           description: The amount won in the Roulette game.
 *         amountLost:
 *           type: number
 *           description: The amount lost in the Roulette game.
 *         nonce:
 *           type: number
 *           description: The nonce value for the Roulette game.
 *           example: 123456
 *         gameSeed:
 *           type: string
 *           description: The ID of the game seed document.
 *       example:
 *         account: "60d0fe4f5311236168a109ca"
 *         amount: 100
 *         wager: { "color": "red", "number": 7 }
 *         strikeNumber: 7
 *         strikeMultiplier: 2
 *         result: "Won"
 *         tokenMint: "SOL"
 *         houseEdge: 0.05
 *         amountWon: 200
 *         amountLost: 0
 *         nonce: 123456
 *         gameSeed: "60d0fe4f5311236168a109cb"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Wheel:
 *       type: object
 *       required:
 *         - account
 *         - amount
 *         - risk
 *         - segments
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
 *           description: The user account ID.
 *         amount:
 *           type: number
 *           description: The amount wagered in the Wheel game.
 *         risk:
 *           type: string
 *           enum: ["low", "medium", "high"]
 *           description: The risk level chosen for the Wheel game.
 *         segments:
 *           type: number
 *           description: The number of segments on the wheel.
 *         strikeNumber:
 *           type: number
 *           description: The segment number that was hit in the Wheel game.
 *         strikeMultiplier:
 *           type: number
 *           description: The multiplier applied if the strike number is hit.
 *         result:
 *           type: string
 *           enum: ["Won", "Lost"]
 *           description: The result of the Wheel game.
 *         tokenMint:
 *           type: string
 *           description: The token mint used in the Wheel game.
 *         houseEdge:
 *           type: number
 *           description: The house edge percentage for the Wheel game.
 *         amountWon:
 *           type: number
 *           description: The amount won in the Wheel game.
 *         amountLost:
 *           type: number
 *           description: The amount lost in the Wheel game.
 *         nonce:
 *           type: number
 *           description: The nonce value for the Wheel game.
 *         gameSeed:
 *           type: string
 *           description: The ID of the game seed document.
 *       example:
 *         account: "60d0fe4f5311236168a109ca"
 *         amount: 100
 *         risk: "medium"
 *         segments: 20
 *         strikeNumber: 7
 *         strikeMultiplier: 2
 *         result: "Won"
 *         tokenMint: "SOL"
 *         houseEdge: 0.05
 *         amountWon: 200
 *         amountLost: 0
 *         nonce: 123456
 *         gameSeed: "60d0fe4f5311236168a109cb"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ReferralCampaign:
 *       type: object
 *       required:
 *         - account
 *         - campaignName
 *         - referralCode
 *         - signupCount
 *       properties:
 *         account:
 *           type: string
 *           description: The ID of the referral user account.
 *         campaignName:
 *           type: string
 *           description: The name of the referral campaign.
 *         referralCode:
 *           type: string
 *           description: A unique code associated with the referral campaign.
 *         totalEarnings:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: A map that tracks total earnings by different currencies or tokens.
 *         unclaimedEarnings:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: A map that tracks unclaimed earnings by different currencies or tokens.
 *         signupCount:
 *           type: number
 *           description: The total number of signups generated by this referral campaign.
 *       example:
 *         account: "60d0fe4f5311236168a109ca"
 *         campaignName: "Summer Promo 2024"
 *         referralCode: "SUMMER2024"
 *         totalEarnings: { "USD": 100, "SOL": 10 }
 *         unclaimedEarnings: { "USD": 50, "SOL": 5 }
 *         signupCount: 25
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ReferralUser:
 *       type: object
 *       required:
 *         - account
 *       properties:
 *         account:
 *           type: string
 *           description: The ID of the associated GameUser account.
 *         campaigns:
 *           type: array
 *           items:
 *             type: string
 *           description: An array of campaign IDs that the user has created.
 *         referredByChain:
 *           type: array
 *           items:
 *             type: string
 *           description: An array of campaign IDs through which the user was referred, forming a referral chain.
 *         volume:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: A map that tracks the volume generated by the user in different currencies or tokens.
 *         feeGenerated:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: A map that tracks the fees generated by the user in different currencies or tokens.
 *       example:
 *         account: "60d0fe4f5311236168a109ca"
 *         campaigns: ["60d0fe4f5311236168a109cb", "60d0fe4f5311236168a109cc"]
 *         referredByChain: ["60d0fe4f5311236168a109cd"]
 *         volume: { "USD": 1000, "SOL": 50 }
 *         feeGenerated: { "USD": 100, "SOL": 5 }
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RecentBuyer:
 *       type: object
 *       required:
 *         - buyer
 *         - gameId
 *         - numOfTickets
 *         - totalAmount
 *         - txnSignature
 *       properties:
 *         buyer:
 *           type: string
 *           description: The identifier of the buyer, such as a username or wallet address.
 *         gameId:
 *           type: number
 *           description: The ID of the game in which the buyer is participating.
 *         numOfTickets:
 *           type: number
 *           description: The number of tickets purchased by the buyer.
 *         totalAmount:
 *           type: number
 *           description: The total amount spent by the buyer for the tickets.
 *         txnSignature:
 *           type: string
 *           description: The unique transaction signature associated with the purchase.
 *       example:
 *         buyer: "0x123456789abcdef"
 *         gameId: 42
 *         numOfTickets: 5
 *         totalAmount: 150
 *         txnSignature: "3b6f1b6a2f7e6c2d4e5f6a2b3c1d4e5f6a2b3c1d4e5f6a2b3c1d4e5f"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - account
 *         - solAmount
 *         - keys
 *         - stakedAmount
 *         - multiplier
 *         - points
 *       properties:
 *         account:
 *           type: string
 *           description: Reference to the user's account.
 *         solAmount:
 *           type: number
 *           description: The amount of Solana (SOL) the user holds.
 *         keys:
 *           type: number
 *           description: The number of keys the user has.
 *         stakedAmount:
 *           type: number
 *           description: The amount of SOL the user has staked.
 *         multiplier:
 *           type: number
 *           description: The multiplier applied to the user's staked amount or points.
 *         points:
 *           type: number
 *           description: The user's points.
 *       example:
 *         account: "6119f7f3e8b5f31a5b6b8d10"
 *         solAmount: 10.5
 *         keys: 3
 *         stakedAmount: 5.0
 *         multiplier: 1.5
 *         points: 1500
 */
