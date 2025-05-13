import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { ElementsList } from "./ElementsList";

export const DraggableElementsList = (props) => (
  <DndProvider backend={HTML5Backend}>
    <ElementsList {...props} />
  </DndProvider>
);