const globalConfig: GlobalConfig = {
  //mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017',
  //mongoDbName: process.env.MONGO_DB_NAME || 'your-db-name',
  siweSecret: process.env.SIWE_SECRET || 'XokQVThqFH^Gp%T7!B4KznKN&d7gsYuf',
  logLevel: process.env.LOG_LEVEL || 'debug',
}

export default globalConfig
