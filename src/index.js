import _ from 'lodash'
import xray from 'x-ray'
import example from './example_payload'
import fsp from 'fs-promise'
import moment from 'moment'

const DCM476_DIAG_URL = 'http://192.168.100.1/Diagnostics.asp'

const x = xray()

const analyze = (err, data) => {
  if (err) throw err
  // [ [ 'Channel', 'Frequency', 'Power', 'SNR', 'BER', 'Modulation' ],
  //   [ '1', '693.0 MHz', '7.4 dBmV', '32.5 dB', '0.000 %', '256 QAM' ],
  //   [ '2', '681.0 MHz', '3.3 dBmV', '29.8 dB', '0.000 %', '256 QAM' ],
  //   [ '3', '687.0 MHz', '5.4 dBmV', '31.2 dB', '0.000 %', '256 QAM' ],
  //   [ '4', '675.0 MHz', '1.7 dBmV', '28.4 dB', '0.063 %', '256 QAM' ],
  //   [ '5', '699.0 MHz', '8.0 dBmV', '32.9 dB', '0.000 %', '256 QAM' ],
  //   [ '6', '657.0 MHz', '5.7 dBmV', '31.2 dB', '0.000 %', '256 QAM' ],
  //   [ '7', '663.0 MHz', '4.3 dBmV', '30.1 dB', '0.000 %', '256 QAM' ],
  //   [ '8', '669.0 MHz', '2.8 dBmV', '28.7 dB', '0.022 %', '256 QAM' ],
  //   [ 'Channel ID',
  //     'Frequency',
  //     'Power',
  //     'Modulation',
  //     '1',
  //     '30.6 MHz' ],
  //   [ '39.8 dBmV', '64 QAM', '2', '23.7 MHz', '40.3 dBmV', '64 QAM' ],
  //   [ '3', '38.6 MHz', '39.8 dBmV', '64 QAM', '0', '0.0 MHz' ],
  //   [ '1.0 dBmV', 'QPSK' ] ]

  const FORWARD_ROWS = 9
  const FORWARD_COLS = 6
  const FORWARD_CELLS = FORWARD_ROWS * FORWARD_COLS

  // const RETURN_ROWS = 5
  // const RETURN_COLS = 4

  const forwardData = _.slice(data, 0, FORWARD_CELLS)
  // const returnData = _.slice(data, FORWARD_CELLS)

  const forwardTable = _.chunk(forwardData, FORWARD_COLS)  // Array<Array<String>

  const forwardKeys = _.head(forwardTable)
  const forwardValues = _.drop(forwardTable)

  const arrayToObjReducer = (obj, value, index) => {
    const key = forwardKeys[index]
    obj[key] = value  // eslint-disable-line
    return obj
  }

  const forwardObjects = _.map(forwardValues, value => (
    _.reduce(value, arrayToObjReducer, {})
  ))

  const timestamp = moment().format('YYYYDDHH_HHmmss')
  const allFilename = `./data/${timestamp}_all.json`
  fsp.writeFile(allFilename, JSON.stringify(forwardObjects))

  forwardObjects.forEach((obj) => {
    const csvFilename = `./data/${obj.Frequency.replace(' ', '_')}.csv`
    const values = [
      timestamp,
      ...(Object.values(obj)),
    ]
    fsp.appendFile(csvFilename, values)
  })
}

const performLogging = () => {
  x(DCM476_DIAG_URL, ['table.light tr td'])(analyze)
}

performLogging()
