export type Fomo3d = {
  version: "0.1.0";
  name: "fomo_3d";
  instructions: [
    {
      name: "initializeVault";
      accounts: [
        {
          name: "vaultAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "internalAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "teamAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [];
    },
    {
      name: "initializeGame";
      accounts: [
        {
          name: "gameAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [];
    },
    {
      name: "settleReward";
      accounts: [
        {
          name: "settler";
          isMut: true;
          isSigner: true;
        },
        {
          name: "userAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "gameAccount";
          isMut: true;
          isSigner: false;
        },
      ];
      args: [];
    },
    {
      name: "buyTicket";
      accounts: [
        {
          name: "gameAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "prevGameAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "buyer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "internalAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "teamAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "vaultAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "referrerAccount";
          isMut: true;
          isSigner: false;
          isOptional: true;
        },
        {
          name: "btcPriceAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: "team";
          type: "string";
        },
        {
          name: "quantity";
          type: "u64";
        },
      ];
    },
    {
      name: "withdrawUserBalance";
      accounts: [
        {
          name: "withdrawer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "userAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "vaultAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [];
    },
    {
      name: "createReferralCode";
      accounts: [
        {
          name: "userAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "referrer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "teamAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "vaultAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [];
    },
    {
      name: "extendGame";
      accounts: [
        {
          name: "gameAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [];
    },
  ];
  accounts: [
    {
      name: "vaultAccountV2";
      type: {
        kind: "struct";
        fields: [
          {
            name: "totalAmount";
            type: "f64";
          },
          {
            name: "balanceAmount";
            type: "f64";
          },
          {
            name: "burnedAmount";
            type: "f64";
          },
          {
            name: "teamAmount";
            type: "f64";
          },
          {
            name: "refCreationAmount";
            type: "f64";
          },
          {
            name: "totalWallets";
            type: "u64";
          },
          {
            name: "isInitialized";
            type: "bool";
          },
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "currGameId";
            type: "u16";
          },
          {
            name: "internalAccount";
            type: "publicKey";
          },
          {
            name: "teamAccount";
            type: "publicKey";
          },
          {
            name: "sidepotAmount";
            type: "f64";
          },
          {
            name: "sidepotProbability";
            type: "u64";
          },
          {
            name: "sidepotAmountWon";
            type: "f64";
          },
          {
            name: "lastSidepotWinner";
            type: "publicKey";
          },
          {
            name: "bump";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "randomNumAccount";
      type: {
        kind: "struct";
        fields: [
          {
            name: "randomNum";
            type: "u64";
          },
          {
            name: "isUsed";
            type: "bool";
          },
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "bump";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "gameAccountV2";
      type: {
        kind: "struct";
        fields: [
          {
            name: "gameId";
            type: "u16";
          },
          {
            name: "totalTickets";
            type: "u64";
          },
          {
            name: "constTickets";
            type: "u64";
          },
          {
            name: "totalAmount";
            type: "f64";
          },
          {
            name: "jackpotAmount";
            type: "f64";
          },
          {
            name: "playersAmount";
            type: "f64";
          },
          {
            name: "burnedAmount";
            type: "f64";
          },
          {
            name: "teamWiseAmount";
            type: {
              array: ["f64", 4];
            };
          },
          {
            name: "teamWiseTickets";
            type: {
              array: ["u64", 4];
            };
          },
          {
            name: "teamAmount";
            type: "f64";
          },
          {
            name: "startTime";
            type: "i64";
          },
          {
            name: "endTime";
            type: "i64";
          },
          {
            name: "lastBuyer";
            type: {
              option: "publicKey";
            };
          },
          {
            name: "isClaimed";
            type: "bool";
          },
          {
            name: "isInitialized";
            type: "bool";
          },
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "playersAmountPerTicket";
            type: "f64";
          },
        ];
      };
    },
    {
      name: "userAccountV2";
      type: {
        kind: "struct";
        fields: [
          {
            name: "totalTickets";
            type: "u64";
          },
          {
            name: "currGame";
            type: "publicKey";
          },
          {
            name: "currGameTickets";
            type: "u64";
          },
          {
            name: "totalAmount";
            type: "f64";
          },
          {
            name: "referralAmount";
            type: "f64";
          },
          {
            name: "referrerAuthority";
            type: {
              option: "publicKey";
            };
          },
          {
            name: "balanceAmount";
            type: "f64";
          },
          {
            name: "playersAmount";
            type: "f64";
          },
          {
            name: "sidepotAmount";
            type: "f64";
          },
          {
            name: "sidepotWins";
            type: "u32";
          },
          {
            name: "currEarnedGameId";
            type: "u16";
          },
          {
            name: "currPlayersAmount";
            type: "f64";
          },
          {
            name: "currReferralAmount";
            type: "f64";
          },
          {
            name: "currSidepotAmount";
            type: "f64";
          },
          {
            name: "isReferralCodeUsed";
            type: "bool";
          },
          {
            name: "isReferralCodeCreated";
            type: "bool";
          },
          {
            name: "isInitialized";
            type: "bool";
          },
          {
            name: "isSettled";
            type: "bool";
          },
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "playersAmountPerTicket";
            type: "f64";
          },
        ];
      };
    },
  ];
  types: [
    {
      name: "TeamInfo";
      type: {
        kind: "struct";
        fields: [
          {
            name: "potPercentage";
            type: "u8";
          },
          {
            name: "playersPercentage";
            type: "u8";
          },
          {
            name: "burnPercentage";
            type: "u8";
          },
        ];
      };
    },
  ];
  errors: [
    {
      code: 6000;
      name: "InvalidGameAccount";
      msg: "Same game account cannot be used for prev and curr game";
    },
    {
      code: 6001;
      name: "InsufficientRentBalance";
      msg: "Vault account won't have sufficient rent exemption fee";
    },
    {
      code: 6002;
      name: "ReferralAccountMismatch";
      msg: "Referral account passed does not match referral code";
    },
    {
      code: 6003;
      name: "AuthorityMismatch";
      msg: "Authority of vault account, game account don't match";
    },
    {
      code: 6004;
      name: "InternalAccountMismatch";
      msg: "Internal account doesn't match that of vault account";
    },
    {
      code: 6005;
      name: "TeamAccountMismatch";
      msg: "Team account doesn't match that of vault account";
    },
    {
      code: 6006;
      name: "ReferrerAccountNotCreated";
      msg: "The referrer account used has not been created";
    },
    {
      code: 6007;
      name: "InvalidDistribution";
      msg: "Ticket amount distribution does not sum to 86";
    },
    {
      code: 6008;
      name: "InsufficientVaultBalance";
      msg: "Vault account does not have suffient balance";
    },
    {
      code: 6009;
      name: "InvalidAuthority";
      msg: "PDA account authority does not match signer";
    },
    {
      code: 6010;
      name: "TokenOwnerMismatch";
      msg: "Token account in not owner of token account";
    },
    {
      code: 6011;
      name: "PrevGameNotInitialized";
      msg: "Previous game account is not initialized";
    },
    {
      code: 6012;
      name: "CurrentGameMismatch";
      msg: "Current game does not match game account";
    },
    {
      code: 6013;
      name: "InvalidQuantity";
      msg: "Ticket quantity must be greater than 0";
    },
    {
      code: 6014;
      name: "GameNotInitialized";
      msg: "Game account is not initialized";
    },
    {
      code: 6015;
      name: "PrevGameAccountMismatch";
      msg: "Previous game account mismatch";
    },
    {
      code: 6016;
      name: "InvalidAuthorityProgramId";
      msg: "Invalid authority program id";
    },
    {
      code: 6017;
      name: "UserAccountNotSettled";
      msg: "User account is not settled";
    },
    {
      code: 6018;
      name: "ReferralAccountMissing";
      msg: "Referral account is missing";
    },
    {
      code: 6019;
      name: "PrevGameNotEnded";
      msg: "Previous game has not ended";
    },
    {
      code: 6020;
      name: "InvalidTeamName";
      msg: "Invalid team name provided";
    },
    {
      code: 6021;
      name: "InsufficientTeamBalance";
      msg: "Insufficient team balance";
    },
    {
      code: 6022;
      name: "InvalidReferrerAccount";
      msg: "User cannot refer himself";
    },
    {
      code: 6023;
      name: "GameNotStarted";
      msg: "Game has not started yet";
    },
    {
      code: 6024;
      name: "GameHasNotEnded";
      msg: "Game has not ended yet";
    },
    {
      code: 6025;
      name: "GameEnded";
      msg: "Game has ended";
    },
    {
      code: 6026;
      name: "GameMinBuy";
      msg: "Min buy requirement not met";
    },
    {
      code: 6027;
      name: "UserPreGameLimit";
      msg: "User pre-game limit exceeded";
    },
    {
      code: 6028;
      name: "PreGameLimit";
      msg: "Pre-game limit exceeded";
    },
    {
      code: 6029;
      name: "BreakOngoing";
      msg: "Break between games ongoing";
    },
  ];
};

export const IDL: Fomo3d = {
  version: "0.1.0",
  name: "fomo_3d",
  instructions: [
    {
      name: "initializeVault",
      accounts: [
        {
          name: "vaultAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "internalAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "teamAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "initializeGame",
      accounts: [
        {
          name: "gameAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "settleReward",
      accounts: [
        {
          name: "settler",
          isMut: true,
          isSigner: true,
        },
        {
          name: "userAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "gameAccount",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "buyTicket",
      accounts: [
        {
          name: "gameAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "prevGameAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "buyer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "internalAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "teamAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "vaultAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "referrerAccount",
          isMut: true,
          isSigner: false,
          isOptional: true,
        },
        {
          name: "btcPriceAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "team",
          type: "string",
        },
        {
          name: "quantity",
          type: "u64",
        },
      ],
    },
    {
      name: "withdrawUserBalance",
      accounts: [
        {
          name: "withdrawer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "userAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "vaultAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "createReferralCode",
      accounts: [
        {
          name: "userAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "referrer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "teamAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "vaultAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "extendGame",
      accounts: [
        {
          name: "gameAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "vaultAccountV2",
      type: {
        kind: "struct",
        fields: [
          {
            name: "totalAmount",
            type: "f64",
          },
          {
            name: "balanceAmount",
            type: "f64",
          },
          {
            name: "burnedAmount",
            type: "f64",
          },
          {
            name: "teamAmount",
            type: "f64",
          },
          {
            name: "refCreationAmount",
            type: "f64",
          },
          {
            name: "totalWallets",
            type: "u64",
          },
          {
            name: "isInitialized",
            type: "bool",
          },
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "currGameId",
            type: "u16",
          },
          {
            name: "internalAccount",
            type: "publicKey",
          },
          {
            name: "teamAccount",
            type: "publicKey",
          },
          {
            name: "sidepotAmount",
            type: "f64",
          },
          {
            name: "sidepotProbability",
            type: "u64",
          },
          {
            name: "sidepotAmountWon",
            type: "f64",
          },
          {
            name: "lastSidepotWinner",
            type: "publicKey",
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "randomNumAccount",
      type: {
        kind: "struct",
        fields: [
          {
            name: "randomNum",
            type: "u64",
          },
          {
            name: "isUsed",
            type: "bool",
          },
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "gameAccountV2",
      type: {
        kind: "struct",
        fields: [
          {
            name: "gameId",
            type: "u16",
          },
          {
            name: "totalTickets",
            type: "u64",
          },
          {
            name: "constTickets",
            type: "u64",
          },
          {
            name: "totalAmount",
            type: "f64",
          },
          {
            name: "jackpotAmount",
            type: "f64",
          },
          {
            name: "playersAmount",
            type: "f64",
          },
          {
            name: "burnedAmount",
            type: "f64",
          },
          {
            name: "teamWiseAmount",
            type: {
              array: ["f64", 4],
            },
          },
          {
            name: "teamWiseTickets",
            type: {
              array: ["u64", 4],
            },
          },
          {
            name: "teamAmount",
            type: "f64",
          },
          {
            name: "startTime",
            type: "i64",
          },
          {
            name: "endTime",
            type: "i64",
          },
          {
            name: "lastBuyer",
            type: {
              option: "publicKey",
            },
          },
          {
            name: "isClaimed",
            type: "bool",
          },
          {
            name: "isInitialized",
            type: "bool",
          },
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "playersAmountPerTicket",
            type: "f64",
          },
        ],
      },
    },
    {
      name: "userAccountV2",
      type: {
        kind: "struct",
        fields: [
          {
            name: "totalTickets",
            type: "u64",
          },
          {
            name: "currGame",
            type: "publicKey",
          },
          {
            name: "currGameTickets",
            type: "u64",
          },
          {
            name: "totalAmount",
            type: "f64",
          },
          {
            name: "referralAmount",
            type: "f64",
          },
          {
            name: "referrerAuthority",
            type: {
              option: "publicKey",
            },
          },
          {
            name: "balanceAmount",
            type: "f64",
          },
          {
            name: "playersAmount",
            type: "f64",
          },
          {
            name: "sidepotAmount",
            type: "f64",
          },
          {
            name: "sidepotWins",
            type: "u32",
          },
          {
            name: "currEarnedGameId",
            type: "u16",
          },
          {
            name: "currPlayersAmount",
            type: "f64",
          },
          {
            name: "currReferralAmount",
            type: "f64",
          },
          {
            name: "currSidepotAmount",
            type: "f64",
          },
          {
            name: "isReferralCodeUsed",
            type: "bool",
          },
          {
            name: "isReferralCodeCreated",
            type: "bool",
          },
          {
            name: "isInitialized",
            type: "bool",
          },
          {
            name: "isSettled",
            type: "bool",
          },
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "playersAmountPerTicket",
            type: "f64",
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "TeamInfo",
      type: {
        kind: "struct",
        fields: [
          {
            name: "potPercentage",
            type: "u8",
          },
          {
            name: "playersPercentage",
            type: "u8",
          },
          {
            name: "burnPercentage",
            type: "u8",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidGameAccount",
      msg: "Same game account cannot be used for prev and curr game",
    },
    {
      code: 6001,
      name: "InsufficientRentBalance",
      msg: "Vault account won't have sufficient rent exemption fee",
    },
    {
      code: 6002,
      name: "ReferralAccountMismatch",
      msg: "Referral account passed does not match referral code",
    },
    {
      code: 6003,
      name: "AuthorityMismatch",
      msg: "Authority of vault account, game account don't match",
    },
    {
      code: 6004,
      name: "InternalAccountMismatch",
      msg: "Internal account doesn't match that of vault account",
    },
    {
      code: 6005,
      name: "TeamAccountMismatch",
      msg: "Team account doesn't match that of vault account",
    },
    {
      code: 6006,
      name: "ReferrerAccountNotCreated",
      msg: "The referrer account used has not been created",
    },
    {
      code: 6007,
      name: "InvalidDistribution",
      msg: "Ticket amount distribution does not sum to 86",
    },
    {
      code: 6008,
      name: "InsufficientVaultBalance",
      msg: "Vault account does not have suffient balance",
    },
    {
      code: 6009,
      name: "InvalidAuthority",
      msg: "PDA account authority does not match signer",
    },
    {
      code: 6010,
      name: "TokenOwnerMismatch",
      msg: "Token account in not owner of token account",
    },
    {
      code: 6011,
      name: "PrevGameNotInitialized",
      msg: "Previous game account is not initialized",
    },
    {
      code: 6012,
      name: "CurrentGameMismatch",
      msg: "Current game does not match game account",
    },
    {
      code: 6013,
      name: "InvalidQuantity",
      msg: "Ticket quantity must be greater than 0",
    },
    {
      code: 6014,
      name: "GameNotInitialized",
      msg: "Game account is not initialized",
    },
    {
      code: 6015,
      name: "PrevGameAccountMismatch",
      msg: "Previous game account mismatch",
    },
    {
      code: 6016,
      name: "InvalidAuthorityProgramId",
      msg: "Invalid authority program id",
    },
    {
      code: 6017,
      name: "UserAccountNotSettled",
      msg: "User account is not settled",
    },
    {
      code: 6018,
      name: "ReferralAccountMissing",
      msg: "Referral account is missing",
    },
    {
      code: 6019,
      name: "PrevGameNotEnded",
      msg: "Previous game has not ended",
    },
    {
      code: 6020,
      name: "InvalidTeamName",
      msg: "Invalid team name provided",
    },
    {
      code: 6021,
      name: "InsufficientTeamBalance",
      msg: "Insufficient team balance",
    },
    {
      code: 6022,
      name: "InvalidReferrerAccount",
      msg: "User cannot refer himself",
    },
    {
      code: 6023,
      name: "GameNotStarted",
      msg: "Game has not started yet",
    },
    {
      code: 6024,
      name: "GameHasNotEnded",
      msg: "Game has not ended yet",
    },
    {
      code: 6025,
      name: "GameEnded",
      msg: "Game has ended",
    },
    {
      code: 6026,
      name: "GameMinBuy",
      msg: "Min buy requirement not met",
    },
    {
      code: 6027,
      name: "UserPreGameLimit",
      msg: "User pre-game limit exceeded",
    },
    {
      code: 6028,
      name: "PreGameLimit",
      msg: "Pre-game limit exceeded",
    },
    {
      code: 6029,
      name: "BreakOngoing",
      msg: "Break between games ongoing",
    },
  ],
};
