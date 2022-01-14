import './Switch.css'

import React from 'react'

interface SwitchProps {
  idString: string
  fraktalMode: boolean
  fraktalModeSet: React.Dispatch<React.SetStateAction<boolean>>
}

function Switch({ idString, fraktalMode, fraktalModeSet }: SwitchProps) {
  return (
    <>
      <div className="Arrange">
        {fraktalMode ? (
          // <div className="TextArrange">
          //   <div className="ercType">
          //     <span style={{ color: '#FFF68F' }}>FRAKTION </span>
          //   </div>
          //   <div className="erc">
          //     <span>ERC</span> <span style={{ color: '#ffffff' }}>-</span>
          //     <span style={{ color: '#FFF68F' }}>1155</span>
          //   </div>
          //   <div className="borderPurple">Mode</div>
          // </div>
          <div className="TextArrange">
            <div className="ercType">
              <div className="ModeText">
                <span style={{ color: '#FFF68F' }}>FRAKTION </span>
              </div>
              <div className="erc">
                <span className="AestheticText">ERC</span> <span style={{ color: '#ffffff' }}>-</span>
                <span style={{ color: '#FFF68F' }}>1155</span>
              </div>
            </div>

            <div>Mode</div>
          </div>
        ) : (
          <div className="TextArrange">
            <div className="ercType">
              <div className="ModeText">
                <span style={{ color: '#ffc0cb' }}>TOKEN </span>
              </div>
              <div className="erc">
                <span className="AestheticText">ERC</span> <span style={{ color: '#ffffff' }}>-</span>
                <span style={{ color: '#ffc0cb' }}>20</span>
              </div>
            </div>

            <div>Mode</div>
          </div>
        )}
        <div className="SwitchBox">
          <input
            checked={fraktalMode}
            onChange={() => fraktalModeSet(!fraktalMode)}
            className="react-switch-checkbox"
            id={idString}
            type="checkbox"
          />
          <label
            style={{ background: fraktalMode ? '#FFF68F' : '#ffc0cb' }}
            className="react-switch-label"
            htmlFor={idString}
          >
            <span style={{ background: fraktalMode ? '#ffc0cb' : '#FFF68F' }} className={`react-switch-button`} />
          </label>
        </div>
      </div>
    </>
  )
}

export default Switch
