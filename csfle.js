const mongodb = require("mongodb");
const { MongoClient, Binary, ClientEncryption } = mongodb;

async function queryEncryptedDoc() {

    const connectionString = ""; // INSERT DB CONNECTION STRING
    const regularClient = new MongoClient(connectionString);

    const coll = "data";
    const db = "encryption";
    const namespace = `${db}.${coll}`;

    const keyVaultNamespace = "encryption.__keyVault";
    // const keyVaultCust2 = "encryption.__keyVault2";

    const kmsProviders = {
        aws: {
          accessKeyId: "", // INSERT ACCESS KEY ID FROM KMS
          secretAccessKey: "", // INSERT SECRET ACCESS KEY FROM KMS
        },
    };

    dataKey = ""; // INSERT DATA KEY HERE AFTER RUNNING generateKey.js
    const schema = {
      bsonType: "object",
      encryptMetadata: {
        keyId: [new Binary(Buffer.from(dataKey, "base64"), 4)],
      },
      properties: {
        insurance: {
          bsonType: "object",
          properties: {
            policyNumber: {
              encrypt: {
                bsonType: "int",
                algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
              },
            },
          },
        },
        medicalRecords: {
          encrypt: {
            bsonType: "array",
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
          },
        },
        bloodType: {
          encrypt: {
            bsonType: "string",
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
          },
        },
        ssn: {
          encrypt: {
            bsonType: "int",
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
          },
        },
      },
    };
    
    var patientSchema = {};
    patientSchema[namespace] = schema;

    const extraOptions = {
      cryptSharedLibPath: "", // INSERT PATH OF CRYPT SHARED LIB PATH
    };

    const secureClient = new MongoClient(connectionString, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      autoEncryption: {
        keyVaultNamespace,
        kmsProviders,
        schemaMap: patientSchema,
        extraOptions: extraOptions,
      },
    });


    try {
      const writeResult = await secureClient
        .db(db)
        .collection(coll)
        .insertOne({
          name: "Jon Doe",
          ssn: 241014209,
          bloodType: "AB+",
          medicalRecords: [{ weight: 180, bloodPressure: "120/80" }],
          insurance: {
            policyNumber: 123142,
            provider: "MaestCare",
          },
        });
    } catch (writeError) {
      console.error("writeError occurred:", writeError);
    }


    console.log("Finding a document with regular (non-encrypted) client.");
    console.log(
      await regularClient.db(db).collection(coll).findOne({ name: "Jon Doe" })
    );
    
    console.log(
      "Finding a document with encrypted client, searching on an encrypted field"
    );
    console.log(
      await secureClient.db(db).collection(coll).findOne({ ssn: 241014209 })
    );

    await regularClient.close();
    await secureClient.close();
}

queryEncryptedDoc();