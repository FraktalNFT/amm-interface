/* eslint-disable @typescript-eslint/no-unused-vars */
import './YapePanelHeader.css'

import Switch from 'components/Switch'
import React from 'react'

import gavel from './outline_gavel_white_24dp.png'

interface YapePanelHeaderProps {
  nftName: string
  artistInfo?: string
  description?: string
  idString: string
  image: string
  fraktalMode: boolean
  fraktalModeSet: React.Dispatch<React.SetStateAction<boolean>>
}

const YapePanelHeader = ({
  nftName,
  artistInfo,
  description,
  idString,
  image,
  fraktalMode,
  fraktalModeSet,
}: YapePanelHeaderProps) => {
  return (
    <>
      {fraktalMode ? (
        <div className="Container">
          {console.log(image)}
          <img className="FixedImg" src={image}></img>

          <div className="ContainedSpacer">
            <div className="SubHeader">
              <div className="ItemText">{nftName}</div>
              <Switch idString={idString} fraktalMode={fraktalMode} fraktalModeSet={fraktalModeSet} />
            </div>

            <div className="DetailsContainer">
              <div>
                <div className="ArtistText">
                  By: <a href={'https://etherscan.io/address/' + artistInfo}>{artistInfo}</a>
                </div>
                <div className="SpacerDiv"></div>
                <div className="DescriptionText">{description}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="FraktalModeOff">
          <Switch idString={idString} fraktalMode={fraktalMode} fraktalModeSet={fraktalModeSet} />
        </div>
      )}
    </>
  )
}

export default YapePanelHeader
