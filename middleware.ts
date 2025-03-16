import { geolocation } from '@vercel/functions'
import { type NextRequest, NextResponse } from 'next/server'
import countries from './lib/countries.json'

export const config = {
  matcher: '/',
}

export async function middleware(req: NextRequest) {
  const { nextUrl: url } = req
  const geo = geolocation(req)
  const country = geo.country || 'GB'
  const city = geo.city || 'London'
  const region = geo.countryRegion || 'ENG'

  // Check if the country has changed...
  const savedCountry = req.cookies.get('MomCountryPreference')?.value
  if (savedCountry && savedCountry !== country) {

    // If the country has changed, update the cookies ?
    console.log(`Country changed from ${savedCountry} to ${country}`)
    // console.log('Geolocation details:', {
    //   city: geo.city,
    //   region: geo.region,
    //   country: geo.country
    // })
  }

  const countryInfo = countries.find((x) => x.cca2 === country)

  // Fallback to GB values if country not found
  const currencyCode = countryInfo ? Object.keys(countryInfo.currencies)[0] : 'GBP'
  const currency = countryInfo?.currencies[currencyCode] || { symbol: '$', name: 'Pound sterling' }
  const languages = countryInfo ? Object.values(countryInfo.languages).join(', ') : 'English'

  url.searchParams.set('country', country)
  url.searchParams.set('city', city)
  url.searchParams.set('region', region)
  url.searchParams.set('currencyCode', currencyCode)
  url.searchParams.set('currencySymbol', currency.symbol)
  url.searchParams.set('name', currency.name)
  url.searchParams.set('languages', languages)

  const response = NextResponse.rewrite(url)

  if (!req.cookies.has('MomCurrencyCode')) {
    response.cookies.set('MomCurrencyCode', currencyCode, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }

  if (!req.cookies.has('MomCurrencySymbol')) {
    response.cookies.set('MomCurrencySymbol', currency.symbol, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }

  if (!req.cookies.has('MomCountryPreference')) {
    response.cookies.set('MomCountryPreference', country, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }

  return response
}