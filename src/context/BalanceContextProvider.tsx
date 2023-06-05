import {
	AssetsRequest,
	AssetsResponse,
	BalanceByAddressRequest,
	BalanceByAddressResponse,
} from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/view/v1alpha1/view_pb'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../App'
import { uint8ToBase64 } from '../utils/uint8ToBase64'
import { createPromiseClient } from '@bufbuild/connect'
import { ViewProtocolService } from '@buf/penumbra-zone_penumbra.bufbuild_connect-es/penumbra/view/v1alpha1/view_connect'
import { createWebExtTransport } from '../utils/webExtTransport'
import {
	Denom,
	DenomMetadata,
} from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/crypto/v1alpha1/crypto_pb'
import { AssetId } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/crypto/v1alpha1/crypto_pb'
import { Amount } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/crypto/v1alpha1/crypto_pb'

export type AssetBalance = {
	asset?: AssetId
	display: string
	base: string
	exponent: number
	amount: number
}

type StoreState = {
	balance: AssetBalance[]
	assets: AssetsResponse[]
}

const BalanceContext = createContext<StoreState>({
	balance: [],
	assets: [],
})

export const useBalance = () => useContext(BalanceContext)

type Props = {
	children?: React.ReactNode
}

export const BalanceContextProvider = (props: Props) => {
	const auth = useAuth()
	const [balance, setBalance] = useState<
		Record<string, BalanceByAddressResponse>
	>({})
	// const [balances, setBalances] = useState<BalanceByAddressResponse[]>([])
	const [assets, setAssets] = useState<AssetsResponse[]>([])

	const assetBalance: AssetBalance[] = useMemo(() => {
		const detailAssets = Object.entries(balance).map(i => {
			const asset = assets.find(j => {
				return uint8ToBase64(j.denomMetadata?.penumbraAssetId?.inner!) === i[0]
			})

			const exponent = Number(
				asset?.denomMetadata?.denomUnits.find(
					i => i.denom === asset.denomMetadata?.display
				)?.exponent
			)

			const amount =
				(Number(i[1].amount?.lo) + 2 ** 64 * Number(i[1].amount?.hi)) /
				(exponent ? 10 ** exponent : 1)

			return {
				[i[0]]: {
					...i[1],
					display: asset?.denomMetadata?.display || '',
					base: asset?.denomMetadata?.base || '',
					exponent,
					amount,
				},
			}
		})

		return detailAssets
			.map(i => Object.values(i)[0])
			.filter(i => Number(i.amount))
	}, [balance, assets])

	useEffect(() => {
		if (!auth.walletAddress) return
		const getAssets = async () => {
			const client = createPromiseClient(
				ViewProtocolService,
				createWebExtTransport(ViewProtocolService)
			)

			const assetsRequest = new AssetsRequest({})

			for await (const asset of client.assets(assetsRequest)) {
				setAssets(state => [...state, asset])
			}
		}
		getAssets()
	}, [auth.walletAddress])

	useEffect(() => {
		if (!auth.walletAddress) return
		const getBalances = async () => {
			const client = createPromiseClient(
				ViewProtocolService,
				createWebExtTransport(ViewProtocolService)
			)

			const request = new BalanceByAddressRequest({})

			for await (const balance of client.balanceByAddress(request)) {
				const asset = uint8ToBase64(balance.asset?.inner!)

				setBalance(state => ({
					...state,
					[asset]: balance,
				}))
			}
		}
		getBalances()
	}, [auth.walletAddress])

	return (
		<BalanceContext.Provider value={{ balance: assetBalance, assets }}>
			{props.children}
		</BalanceContext.Provider>
	)
}
