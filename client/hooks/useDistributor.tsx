import { useGameContext } from "@/components/GameProvider";
import { numberPair, tileType, useDistributorType } from "@/types";
import { useEffect, useRef, useState } from "react";

export default function useDistributor(
  deckType: string = requestType.OPPONENT_DECK
): useDistributorType {
  const [from, setFrom] = useState<numberPair>();
  const [hand, setHand] = useState<tileType[]>([]);
  const boundRef = useRef<HTMLDivElement | null>(null);
  const counterRef = useRef<number>(0); // countRef keeps track of how many times distCallback has been called for UI purposes
  const callbackID = useRef<number | null>(0);
  const {
    selectFromBoneYard,
    selectFromBoneYardServer,
    registerDistCallback,
    unRegisterDistCallback,
    requestTile,
    permits,
  } = useGameContext();

  useEffect(() => {
    const distCallback = async (position: numberPair, distribute = true) => {
      if (boundRef.current) {
        const bounds = boundRef.current.getBoundingClientRect();
        counterRef.current++;
        console.log(deckType);
        if (deckType === requestType.OPPONENT_DECK) {
          const newHand = { id: 0, tile: [0, 0] as numberPair };
          setHand((prevArr) => [...prevArr, newHand]);
          setFrom([
            bounds.left + 24 * counterRef.current - position[0],
            bounds.top - position[1],
          ]);
          return newHand;
        } else {
          var newHand: tileType;
          if (distribute) {
            newHand = selectFromBoneYard();
          } else {
            newHand = await selectFromBoneYardServer();
          }
          console.log(newHand);
          setHand((preArr) => [...preArr, newHand]);
          setFrom([bounds.right - position[0], bounds.top - position[1]]);
          return newHand;
        }
      }
    };
    callbackID.current = registerDistCallback(distCallback);
    return () => unRegisterDistCallback(callbackID.current as number);
  }, []);

  const tileRequestApi = (amount?: number) => {
    // if (callbackID.current) {
    if (deckType === requestType.MAIN_DECK) {
      requestTile(false, (callbackID.current! + 1) as number, permits);
    } else {
      requestTile(true, callbackID.current as number, [], amount);
    }
    // }
  };
  return [hand, setHand, from, boundRef, tileRequestApi];
}

export const requestType = {
  INITIAL_DROP: "INITIAL_DROP",
  MAIN_DECK: "MAIN_DECK",
  OPPONENT_DECK: "OPPONENT_DECK",
};
