import { TbSquareRoundedFilled } from "react-icons/tb";
import { IoPrism } from "react-icons/io5";
import { IoMapSharp } from "react-icons/io5";
import { IoMdHeart } from "react-icons/io";

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
  yellow: {
    id: 'yellow',
    name: 'styles.yellow',
    icon: <TbSquareRoundedFilled size={16} color='#f6aa06' />
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
  }
};