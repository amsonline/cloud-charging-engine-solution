import { performance } from "perf_hooks";
import supertest from "supertest";
import { buildApp } from "./app";
import * as assert from "assert";

const app = supertest(buildApp());

async function basicLatencyTest() {
    await app.post("/reset").expect(204);
    const start = performance.now();
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    console.log(`Latency: ${performance.now() - start} ms`);
}

async function raceConditionTest() {
    await app.post("/reset").expect(204);
    const chargePromises = [];

    // Launch multiple concurrent requests to charge the same account
    for (let i = 0; i < 5; i++) {
        chargePromises.push((app.post("/charge").send({charges: 20}).expect(200)));
    }

    const resp = await Promise.all(chargePromises);

    for (let r of resp) {
        console.log(r.body);
    }

    // Check the balance after concurrent charges
    const response = await app.post("/charge").expect(200);
    const remainingBalance = response.body.remainingBalance;
    assert.equal(remainingBalance, 0);
    console.log(`Remaining Balance: ${remainingBalance}`);
}

async function runTests() {
    await basicLatencyTest();
    await raceConditionTest();
}

runTests().catch(console.error);
