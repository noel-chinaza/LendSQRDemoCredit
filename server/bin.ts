require("dotenv").config();

import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express from "express";
import { createServer } from "http";

import { PrismaClient } from "@prisma/client";
import path from "path";
import { AuthRouter } from "./controllers/routers/auth.router";
import { ProfileRouter } from "./controllers/routers/profile.router";
import { DepositRouter } from "./controllers/routers/deposit.router";
import { exec, exec as plantSystemExec } from "../prisma/seed/plant_system";
import { WithdrawalRouter } from "./controllers/routers/withdrawal.router";

const prisma = new PrismaClient();

const app = express();

const server = createServer(app);

app.use(require("morgan")("dev"));
// store and read cookies
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//enable CORS
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Methods", "GET");
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Credentials", "true");
	res.header("Access-Control-Allow-Headers", "*");
	next();
});

// development error handler
// will print stacktrace
if (process.env["PRODUCTION"] != "true") {
	app.use(function (err, req, res, next) {
		console.log(err.stack);

		res.status(err.status || /*500*/ 200);

		res.json({
			errors: {
				message: err.message,
				error: err,
			},
		});
	});
}

require("./config/passport");

app.use("/v1/", AuthRouter);
app.use("/v1/", ProfileRouter);
app.use("/v1/", DepositRouter);
app.use("/v1/", WithdrawalRouter);

app.get("/", async function (req, res, next) {
	res.send({
		message: "Welcome to the API 🐤",
		version: "V1",
	});
});

app.use("/coverage", express.static(path.join(__dirname, "/coverage")));
app.use("/ui", express.static(path.join(__dirname, "/ui")));

server.listen(process.env["PORT"], () => {
	exec();
	console.log(`Listening on port ${process.env["PORT"]}`);
});

process.on("uncaughtException", (error, origin) => {
	console.log("----- Uncaught exception -----");
	console.log(error);
	console.log("----- Exception origin -----");
	console.log(origin);
});

process.on("unhandledRejection", (reason, promise) => {
	console.log("----- Unhandled Rejection at -----");
	console.log(promise);
	console.log("----- Reason -----");
	console.log(reason);
});
