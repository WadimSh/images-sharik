import { TbSquareRoundedFilled, TbBat } from "react-icons/tb";
import { IoPrism, IoMapSharp } from "react-icons/io5";
import { IoMdHeart } from "react-icons/io";
import { GiPumpkinLantern, GiBlood, GiPumpkinMask } from "react-icons/gi";
import { FaOptinMonster } from "react-icons/fa";

export const STYLE_VARIANTS = {
  default: {
    id: 'default',
    name: 'styles.default',
    icon: <IoPrism size={16} color='#0056b3' />
  },
  red: {
    id: 'red',
    name: 'styles.red',
    icon: <TbSquareRoundedFilled size={16} color='#e34e46' />
  },
  green: {
    id: 'green',
    name: 'styles.green',
    icon: <TbSquareRoundedFilled size={16} color='#93c527' />
  },
  teal: {
    id: 'teal',
    name: 'styles.teal',
    icon: <TbSquareRoundedFilled size={16} color='#40E0D0' />
  },
  yellow: {
    id: 'yellow',
    name: 'styles.yellow',
    icon: <TbSquareRoundedFilled size={16} color='#f6aa06' />
  },
  champagne: {
    id: 'champagne',
    name: 'styles.champagne',
    icon: <TbSquareRoundedFilled size={16} color='#e3935a' />
  },
  crimson: {
    id: 'crimson',
    name: 'styles.crimson',
    icon: <TbSquareRoundedFilled size={16} color='#ec028c' />
  },
  brutal: {
    id: 'brutal',
    name: 'styles.brutal',
    icon: <IoMapSharp size={16} color="#f6aa06" />
  },
  amur1: {
    id: 'amur1',
    name: 'styles.amur1',
    icon: <IoMdHeart size={16} color='#e34e46' />
  },
  amur2: {
    id: 'amur2',
    name: 'styles.amur2',
    icon: <IoMdHeart size={16} color='#ec028c' />
  },
  bat: {
    id: 'bat',
    name: 'styles.bat',
    icon: <TbBat size={20} color='#0056b3' />
  },
  pumpkin: {
    id: 'pumpkin',
    name: 'styles.pumpkin',
    icon: <GiPumpkinLantern size={20} color='#e34e46' />
  },
  blood: {
    id: 'blood',
    name: 'styles.blood',
    icon: <GiBlood size={20} color='#dc3545' />
  },
  carved: {
    id: 'carved',
    name: 'styles.carved',
    icon: <GiPumpkinMask size={20} color='#ec028c' />
  },
  monsters: {
    id: 'monsters',
    name: 'styles.monsters',
    icon: <FaOptinMonster size={24} color='#000000' />
  }
};