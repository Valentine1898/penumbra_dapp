# Penumbra dApp
Penumbra dApp is the canonical wallet functionality interface for the [Penumbra network](https://penumbra.zone).

## Getting started
To use the Penumbra dApp, you must first install the Penumbra wallet extension and import/create a new wallet.
The Penumbra wallet extension is available for installation [in the Chrome store](https://chrome.google.com/webstore/detail/penumbra-wallet/lkpmkhpnhknhmibgnmmhdhgdilepfghe/).
You can also build the wallet extension locally by following the [build instructions](https://github.com/penumbra-zone/wallet).

After you've installed the extension, navigate to the dApp: https://app.testnet.penumbra.zone

## Building the site locally
You can start the site using `npm`:
```
npm install
npm run start
```

Or you can use docker:

```
docker build -t penumbra_dapp .
docker run -p 9012:9012 -it penumbra_dapp
```

In either case, the site will be available at http://localhost:9012.

## Developer documentation
Below we document common uses for developers who want to use the code in their own projects.

### Web3 Browser Detection

To verify if the browser is running Penumbra, copy and paste the code snippet below in the developer console of your web browser:

	const checkIsPenumbraInstalled = async () => {
		const isInstalled = await isPenumbraInstalled() // import from ProviderPenumbra
		if(isInstalled){
			console.log('Penumbra is installed!');
		} else {
			console.log('Please, install penumbra');
		}
	}

### Connecting to Penumbra

"Connecting" or "logging in" to Penumbra effectively means "to access the user's account(s)".

We recommend that you provide a button to allow the user to connect Penumbra to your dapp. Clicking this button should call the following method:

	const handleConnect = async () => {
		const data = await window.penumbra.publicState()
		const account = data.account
	}

### Accessing Accounts

If you'd like to be notified when the user state changes, we have an event you can subscribe to:

	window.penumbra.on('state', state => {
		console.log(state)
	})

### Sending Transactions

Transactions are a formal action on a blockchain. They are always initiated in Penumbra with a call to the signTransaction method. They can involve a simple sending of token. They are always initiated by a signature from an external account, or a simple key pair.

In Penumbra, using the penumbra.signTransaction method directly, sending a transaction will involve composing an options object like this:

	const sendTx = async () => {

		const fullViewingKey = userData.fvk  // fullViewingKey get`s from window.penumbra.publicState()

		if (!fullViewingKey) return;

		const selectedAsset = uint8ToBase64(balance.find(i => i.denom?.denom === select)?.asset
			?.inner!)

		const filteredNotes = notes
			.filter(
				note =>
					!note.noteRecord?.heightSpent &&
					uint8ToBase64(note.noteRecord?.note?.value?.assetId?.inner!) ===
					selectedAsset
			)
			.map(i => i.noteRecord?.toJson())

		if (!filteredNotes.length) console.error('No notes found to spend')

		const client = createPromiseClient(
			ViewProtocolService,
			createWebExtTransport(ViewProtocolService)
		)

		const fmdParameters = (await client.fMDParameters({})).parameters

		if (!fmdParameters) console.error('No found FmdParameters')

		const chainParameters = (await client.chainParameters({})).parameters
		if (!chainParameters) console.error('No found chain parameters')

		const viewServiceData = {
			notes: filteredNotes,
			chain_parameters: chainParameters,
			fmd_parameters: fmdParameters,
		}

		const valueJs = {
			amount: {
				lo: Number(amount) * 1000000,
				hi: 0,
			},
			assetId: { inner: selectedAsset },
		}

		const transactionPlan = await wasm.send_plan(
			fvk,
			valueJs,
			reciever,
			viewServiceData
		)

		await window.penumbra.signTransaction(transactionPlan)
	}

### View Service

### Create client 
	const client = createPromiseClient(
		ViewProtocolService,
		createWebExtTransport(ViewProtocolService)
	)

#### rpc Status

Get current status of chain sync

	await client.status({})

#### rpc StatusStream

Stream sync status updates until the view service has caught up with the core.chain.v1alpha1.

	for await (const note of client.statusStream({})) {
		console.log(note)
	}

#### rpc Notes

Queries for notes that have been accepted by the core.chain.v1alpha1.

	for await (const note of client.notes({})) {
		console.log(note)
	}
#### rpc Assets

Queries for assets.

	for await (const note of client.assets({})) {
		console.log(note)
	}

#### rpc ChainParameters

Query for the current chain parameters.

	await client.chainParameters({})

#### rpc FMDParameters

Query for the current FMD parameters.

	await client.fMDParameters({})

#### rpc BalanceByAddress

Query for balance of a given address

	for await (const note of client.balanceByAddress({})) {
		console.log(note)
	}

#### rpc TransactionInfo

Query for the full transactions in the given range of blocks.

	for await (const note of client.transactionInfo({})) {
		console.log(note)
	}

### Penumbra web assembly usage

WASM bindings can be generated following the procedure documented here:
https://github.com/penumbra-zone/penumbra/tree/main/wasm

#### Creating TransactionPlan for send transaction
```
export function send_plan(full_viewing_key: string, valueJs: any, dest_address: string, view_service_data: any): TransactionPlan;
```
#### Example of use
```
const viewServiceData = {
			notes: filteredNotes,
			chain_parameters: chainParameters,
			fmd_parameters: fmdParameters,
		}

		const valueJs = {
			amount: {
				lo: amount * 1000000,
				hi: 0,
			},
			assetId: { inner: assetId },
		}

		const transactionPlan = await wasm.send_plan(
			fvk,
			valueJs,
			reciever,
			viewServiceData
		)
```
