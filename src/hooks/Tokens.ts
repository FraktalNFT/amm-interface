import { arrayify } from '@ethersproject/bytes'
import { parseBytes32String } from '@ethersproject/strings'
import { Currency, Token } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import { useMemo } from 'react'

import { createTokenFilterFunction } from '../components/SearchModal/filtering'
import { ExtendedEther, WETH9_EXTENDED } from '../constants/tokens'
import {
  getFirstFraktalToken,
  useAllLists,
  useCombinedActiveList,
  useFraktalList,
  useInactiveListUrls,
} from '../state/lists/hooks'
import { WrappedTokenInfo } from '../state/lists/wrappedTokenInfo'
import { NEVER_RELOAD, useSingleCallResult } from '../state/multicall/hooks'
import { useUserAddedTokens } from '../state/user/hooks'
import { isAddress } from '../utils'
import { TokenAddressMap, useUnsupportedTokenList } from './../state/lists/hooks'
import { useBytes32TokenContract, useTokenContract } from './useContract'
import { useActiveWeb3React } from './web3'

// reduce token map into standard address <-> Token mapping, optionally include user added tokens
function useTokensFromMap(tokenMap: TokenAddressMap, includeUserAdded: boolean): { [address: string]: Token } {
  const { chainId } = useActiveWeb3React()
  const userAddedTokens = useUserAddedTokens()

  return useMemo(() => {
    if (!chainId) return {}

    // reduce to just tokens
    const mapWithoutUrls = Object.keys(tokenMap[chainId] ?? {}).reduce<{ [address: string]: Token }>(
      (newMap, address) => {
        newMap[address] = tokenMap[chainId][address].token
        return newMap
      },
      {}
    )

    if (includeUserAdded) {
      return (
        userAddedTokens
          // reduce into all ALL_TOKENS filtered by the current chain
          .reduce<{ [address: string]: Token }>(
            (tokenMap, token) => {
              tokenMap[token.address] = token
              return tokenMap
            },
            // must make a copy because reduce modifies the map, and we do not
            // want to make a copy in every iteration
            { ...mapWithoutUrls }
          )
      )
    }

    return mapWithoutUrls
  }, [chainId, userAddedTokens, tokenMap, includeUserAdded])
}

export function useAllTokens(): { [address: string]: Token } {
  const allTokens = useCombinedActiveList()
  return useTokensFromMap(allTokens, true)
}

export function useFraktalTokens(): { [address: string]: Token } {
  const frakTokens = useFraktalList()
  // console.log('FRAK TOKENS FROM LIST::', frakTokens)
  return useTokensFromMap(frakTokens, true)
}

export function useUnsupportedTokens(): { [address: string]: Token } {
  const unsupportedTokensMap = useUnsupportedTokenList()
  return useTokensFromMap(unsupportedTokensMap, false)
}

export function useSearchInactiveTokenLists(search: string | undefined, minResults = 10): WrappedTokenInfo[] {
  const lists = useAllLists()
  const inactiveUrls = useInactiveListUrls()
  const { chainId } = useActiveWeb3React()
  const activeTokens = useAllTokens()
  const fraktalTokens = useFraktalTokens()
  return useMemo(() => {
    if (!search || search.trim().length === 0) return []
    const tokenFilter = createTokenFilterFunction(search)
    const result: WrappedTokenInfo[] = []
    const addressSet: { [address: string]: true } = {}
    for (const url of inactiveUrls) {
      const list = lists[url].current
      if (!list) continue
      for (const tokenInfo of list.tokens) {
        if (tokenInfo.chainId === chainId && tokenFilter(tokenInfo)) {
          const wrapped: WrappedTokenInfo = new WrappedTokenInfo(tokenInfo, list)
          if (!(wrapped.address in activeTokens) && !addressSet[wrapped.address]) {
            addressSet[wrapped.address] = true
            result.push(wrapped)
            if (result.length >= minResults) return result
          }
        }
      }
    }
    return result
  }, [activeTokens, chainId, inactiveUrls, lists, minResults, search])
}

export function useIsTokenActive(token: Token | undefined | null): boolean {
  const activeTokens = useAllTokens()

  if (!activeTokens || !token) {
    return false
  }

  return !!activeTokens[token.address]
}

// Check if currency is included in custom list from user storage
export function useIsUserAddedToken(currency: Currency | undefined | null): boolean {
  const userAddedTokens = useUserAddedTokens()

  if (!currency) {
    return false
  }

  return !!userAddedTokens.find((token) => currency.equals(token))
}

// parse a name or symbol from a token response
const BYTES32_REGEX = /^0x[a-fA-F0-9]{64}$/

function parseStringOrBytes32(str: string | undefined, bytes32: string | undefined, defaultValue: string): string {
  return str && str.length > 0
    ? str
    : // need to check for proper bytes string and valid terminator
    bytes32 && BYTES32_REGEX.test(bytes32) && arrayify(bytes32)[31] === 0
    ? parseBytes32String(bytes32)
    : defaultValue
}

export function useEasyETH() {
  return useToken('0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9')
}

export function useEasyFraktal() {
  //gets first fraktal token
  // console.log('GETFIRSTFRAKTALTOKEN::', getFirstFraktalToken())
  return useToken('0xebba858df055018f28793cec9295e39abf2fd9d2')
}

// undefined if invalid or does not exist
// null if loading or null was passed
// otherwise returns the token
export function useToken(tokenAddress?: string | null): Token | undefined | null {
  const { chainId } = useActiveWeb3React()
  const tokens = useAllTokens()

  const fraktalTokens = useFraktalTokens()

  const address = isAddress(tokenAddress)

  const artistKey = tokenAddress as keyof typeof fraktalTokens

  //All used to fraktal stuff, obviously
  const isFraktal = fraktalTokens.hasOwnProperty(tokenAddress as string) ? true : false

  const wrappedFraktal = fraktalTokens[artistKey]?.wrapped as WrappedTokenInfo
  const fraktalArtist = wrappedFraktal?.artist
  const fraktalDescription = wrappedFraktal?.description
  const fraktalImage = wrappedFraktal?.image
  const fraktalName = wrappedFraktal?.name
  const fraktalSymbol = wrappedFraktal?.symbol
  const fraktalChainID = wrappedFraktal?.chainId
  const fraktalAddress = wrappedFraktal?.address

  const tokenContract = useTokenContract(address ? address : undefined, false)
  const tokenContractBytes32 = useBytes32TokenContract(address ? address : undefined, false)
  const token: Token | undefined = address ? tokens[address] : undefined

  const tokenName = useSingleCallResult(token ? undefined : tokenContract, 'name', undefined, NEVER_RELOAD)
  const tokenNameBytes32 = useSingleCallResult(
    token ? undefined : tokenContractBytes32,
    'name',
    undefined,
    NEVER_RELOAD
  )
  const symbol = useSingleCallResult(token ? undefined : tokenContract, 'symbol', undefined, NEVER_RELOAD)
  const symbolBytes32 = useSingleCallResult(token ? undefined : tokenContractBytes32, 'symbol', undefined, NEVER_RELOAD)
  const decimals = useSingleCallResult(token ? undefined : tokenContract, 'decimals', undefined, NEVER_RELOAD)

  //We need to gate the tokens
  // ifFraktal then make fraktal token, else go thru standard checks
  return useMemo(() => {
    console.log('ISTOKEN::', token)
    console.log('TOKENADDERSS::', tokenAddress)
    console.log('ChainID::', chainId)
    console.log('DECIMALS.LOADING::', decimals.loading)
    console.log('SYMBOL.LOADING::', symbol.loading)
    console.log('TOKENNAME.LOADING::', tokenName.loading)
    console.log('DECIMALS.RESULT::', decimals.result)
    // console.log('DECIMALS::', decimals)
    // console.log('SYMBOL::', symbol)
    // console.log('TOKENNAME::', tokenName)

    //GOT AN IDEA

    // if (!isFraktal) {
    //   if (token) return token
    //   if (tokenAddress === null) return null
    //   if (decimals.loading || symbol.loading || tokenName.loading) return null
    //   if (decimals.result) {
    //     return new Token(
    //       chainId,
    //       address,
    //       decimals.result[0],
    //       parseStringOrBytes32(symbol.result?.[0], symbolBytes32.result?.[0], 'UNKNOWN'),
    //       parseStringOrBytes32(tokenName.result?.[0], tokenNameBytes32.result?.[0], 'Unknown Token')
    //     )
    //   }
    // } else {
    //   return new Token(chainId, address, 0, fraktalSymbol, fraktalName, fraktalArtist, fraktalDescription, fraktalImage)
    // }

    if (!isFraktal) {
      if (token) return token
      if (tokenAddress === null) return null
      if (!chainId || !address) return undefined
      if (decimals.loading || symbol.loading || tokenName.loading) return null
      if (decimals.result) {
        return new Token(
          chainId,
          address,
          decimals.result[0],
          parseStringOrBytes32(symbol.result?.[0], symbolBytes32.result?.[0], 'UNKNOWN'),
          parseStringOrBytes32(tokenName.result?.[0], tokenNameBytes32.result?.[0], 'Unknown Token')
        )
      }
      return undefined
    } else {
      return new Token(
        fraktalChainID,
        fraktalAddress,
        0,
        fraktalSymbol,
        fraktalName,
        fraktalArtist,
        fraktalDescription,
        fraktalImage
      )
    }
  }, [
    address,
    chainId,
    decimals.loading,
    decimals.result,
    symbol.loading,
    symbol.result,
    symbolBytes32.result,
    token,
    tokenAddress,
    tokenName.loading,
    tokenName.result,
    tokenNameBytes32.result,
    fraktalArtist,
    fraktalDescription,
    fraktalImage,
    fraktalSymbol,
    fraktalAddress,
    fraktalChainID,
    isFraktal,
    fraktalName,
  ])
}

export function useCurrency(currencyId: string | null | undefined): Currency | null | undefined {
  // console.log('USING CURRENCY::')
  // console.log(currencyId)
  const { chainId } = useActiveWeb3React()
  const isETH = currencyId?.toUpperCase() === 'ETH'
  const token = useToken(isETH ? undefined : currencyId)
  // console.log('IS ETH::', isETH)
  const extendedEther = useMemo(
    () =>
      chainId
        ? ExtendedEther.onChain(chainId)
        : // display mainnet when not connected
          ExtendedEther.onChain(SupportedChainId.MAINNET),
    [chainId]
  )
  const weth = chainId ? WETH9_EXTENDED[chainId] : undefined
  if (currencyId === null || currencyId === undefined) return currencyId
  if (weth?.address?.toUpperCase() === currencyId?.toUpperCase()) return weth
  // console.log('TOKEN FROM USECURRENCY::', token)
  return isETH ? extendedEther : token
}
