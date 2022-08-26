import { MongoClient, GridFSBucket } from 'mongodb';
import { Transform } from "json2csv";
import { Readable } from 'stream';
import fs from 'fs';
// import { colorCodeData } from './data';

const colorCodeData = [
    {
        color: "red",
        value: "#f00"
    },
    {
        color: "green",
        value: "#0f0"
    },
    {
        color: "blue",
        value: "#00f"
    },
    {
        color: "cyan",
        value: "#0ff"
    },
    {
        color: "magenta",
        value: "#f0f"
    },
    {
        color: "yellow",
        value: "#ff0"
    },
    {
        color: "black",
        value: "#000"
    }
];

const connectionString = 'mongodb://mongo-0.mongo:27017,mongo-1.mongo:27017,mongo-2.mongo:27017/?replicaSet=rs0';
const client = new MongoClient(connectionString, { useNewUrlParser: true });

run().catch(error => console.error(error));

function generateCSVFile(db, requestId) {

    // Adding Hardcoded Data Here.
    console.log(colorCodeData);

    const input = new Readable({ objectMode: true });
    input._read = () => { };

    // myObjectEmitter is just a fake example representing anything that emit objects.
    colorCodeData.forEach(obj => input.push(obj));

    const output = fs.createWriteStream(`${requestId}.csv`, { encoding: 'utf8' });
    const opts = {};
    const transformOpts = { objectMode: true };

    const json2csv = new Transform(opts, transformOpts);
    const processor = input.pipe(json2csv).pipe(output);

    // Grid FS Save File to Mongodb
    var gfidFsBucket = new GridFSBucket(db);

    fs.createReadStream(`./${requestId}.csv`).
        pipe(gfidFsBucket.openUploadStream(`${requestId}.csv`)).
        on('error', function (error) {
            assert.ifError(error);
        }).
        on('finish', function () {
            console.log('done!');
            processor.exit(0);
        });
}

async function monitorChangesToRequestCollection(client, pipeline = []) {

    const db = await client.db("demo");
    const requestsCollection = db.collection('requests')

    const changeStreamRequests = requestsCollection.watch(pipeline);

    try {
        // set up a listener when change events are emitted
        changeStreamRequests.on("change", (next) => {
            console.log(next);
            console.log(next.fullDocument.requestId);
            generateCSVFile(db, next.fullDocument.requestId);
        });

    } catch {
        await await changeStreamRequests.close();
    }
}

async function run() {
    try {
        console.log('try started');
        await client.connect();
        console.log('Starting: Watch');
        await monitorChangesToRequestCollection(client);
        console.log('Watch In Progress: Started');
        console.log('try completed');

    } catch {
        console.log('Closing Existing db Connection!');
        await client.close();
    }
}