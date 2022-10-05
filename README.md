# Project Brief
Demo Credit is a mobile lending app that requires wallet functionality. This is needed as borrowers need a wallet to receive the loans they have been granted and also send the money for repayments.


The MVP solution must account for the following features:

* A user can create an account
* A user can fund their account
* A user can transfer funds to another user’s account
* A user can withdraw funds from their account.

# Implementation Summary
This project utilizes and implements a traditional accounting system. The cardinal rule of double-entry accounting is that "for every debit entry, there must be a corresponding credit entry" which means "everything must balance out to zero", and that rule is applied to every transaction written to the system.

The project is built with heavy reliance on OOP and creates:

* Abstractions to hide the complexity of the credit-debit system
* Abstractions to handle the dynamic implementation of deposits via varying payment providers
* Abstractions to handle the dynamic implementation of withdrawals

# Directory Structure
The system is organized into layers that are only responsible for the intended functionality in a way that leaves the system upgradable

```
├──── prisma/
|     ├──── schema.prisma   : the modelling file that handles the database design and migrations    
|     ├──── dbml/           : generated graph of the systems database design
├──── seed/ : responsible for initializing the database for first time setup by creating the necessary system profiles and system accounts
|
├──── server/ 
|     ├──── config/ : holds configurations for system variables
|     |     
|     ├──── domain/
|     |     ├──── bin.ts: main entry point for the express server powering the application
|     |     ├──── classes/               : holds class abstractions for models that make system operations simple and  easy to read
|     |     ├──── payment_gateways/      : holds implementations for various payment channels(PAYSTACK &  FLUTTERWAVE in this case study) used by users to deposit money into their accounts which are  upgradable and easily maintainable
|     |     ├──── withdrawal_gateways/   : holds implementations for various withderawal channels (CRYPTO &  BANK in this case study) used by users to remove money from their profiles in the system
|     |     
|     ├──── controllers/
|     |     ├──── messages/              : error messages for the system
|     |     ├──── middlewares/           : express middlewares for handling validation and authentication
|     |     ├──── validators/            : schema validations written in yup
|     |     ├──── handlers/              : class files that handle express requests but are abstracted so they can be testable
|     |     |     ├──── __tests__/       : unit test cases that cycle through the entire business logic 
```

# Setup

Install dependencies and start dev server

```bash
npm install && npm run dev
```

Run UNIT Tests

```bash
npm run test
```


# E-R Diagram

![E-R Diagram](/ER_diagram.png)

# Stack

The application relies heavily on typescript for fundamental but very necessary checking and analysis; to that effect, the [Prisma ORM](https://www.prisma.io/) was used as opposed to KnexJS

Prisma is an ORM that is typesafe, handles migrations, has an intuitive generated API and is easily extensible and overly predictable thereby enhancing developer productivity