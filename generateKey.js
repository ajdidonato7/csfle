const mongodb = require("mongodb");
const { MongoClient, Binary, ClientEncryption } = mongodb;

async function generateDataKey() {
    const uri = "INSERT DB CONNECTION STRING";
    const keyVaultDatabase = "encryption";
    const keyVaultCollection = "__keyVault";
    const keyVaultNamespace = `${keyVaultDatabase}.${keyVaultCollection}`;
    const keyVaultClient = new MongoClient(uri);
    await keyVaultClient.connect();
    const keyVaultDB = keyVaultClient.db(keyVaultDatabase);
    // Drop the Key Vault Collection in case you created this collection
    // in a previous run of this application.
    await keyVaultDB.dropDatabase();
    // Drop the database storing your encrypted fields as all
    // the DEKs encrypting those fields were deleted in the preceding line.
    await keyVaultClient.db("medicalRecords").dropDatabase();
    const keyVaultColl = keyVaultDB.collection(keyVaultCollection);
    await keyVaultColl.createIndex(
      { keyAltNames: 1 },
      {
        unique: true,
        partialFilterExpression: { keyAltNames: { $exists: true } },
      } 
    );
    console.log("index created");

    const provider = "aws";
    const kmsProviders = {
      aws: {
        accessKeyId: "INSERT ACCESS KEY ID FROM KMS",
        secretAccessKey: "INSERT SECRET ACCESS KEY FROM KMS",
      },
    };

    const masterKey = {
        key: "INSERT ARN OF MASTER KEY",
        region: "INSERT REGION OF MASTER KEY",
    };

    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    await client.connect();

    const encryption = new ClientEncryption(client, {
        keyVaultNamespace,
        kmsProviders,
    });
    const key = await encryption.createDataKey(provider, {
        masterKey: masterKey,
    });
    console.log("DataKeyId [base64]: ", key.toString("base64"));
    await keyVaultClient.close();
    await client.close();

}

generateDataKey();

