import { numberPair, tileType } from "@/types";

export function calcVectorAngle(vec1: numberPair, vec2: numberPair) {
  try {
    let dotProduct: number = calcDotProduct(vec1, vec2);
    let vec1Length: number = Math.sqrt(
      vec1.reduce(
        (accumulator, currentValue) => accumulator + currentValue ** 2,
        0
      )
    );
    let vec2Length: number = Math.sqrt(
      vec2.reduce(
        (accumulator, currentValue) => accumulator + currentValue ** 2,
        0
      )
    );

    return Math.acos(dotProduct / (vec1Length * vec2Length)) * (180 / Math.PI);
  } catch (e) {
    console.log(
      "An error occured, check that correct types are passed to calcVectorAngle"
    );
    return 0;
  }
}

export function calcDotProduct(vec1: numberPair, vec2: numberPair) {
  let dotProduct = 0;
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
  }
  return dotProduct;
}

export class TileAlignSpec {
  /*
  Tile Positioning and Alignment 
  spec = [firstHalf, secondHalf, rightSide, leftSide] 
  where spec is a shape of the conneccurrenttions when the tile is upright (0deg), 
  
  e.g when the tile is at 90deg tilt, the firstHalf is on the right,
  the secondHalf is on the left and so on 
  
  0deg = [top, bottom, left, right]
  90deg = [right, left, top, bottom]
  -90deg = [left, right, bottom, top]
  180deg = [bottom, top, right, left]
  */

  id: number;
  root: boolean;
  private _tilt: 0 | 90 | -90 | 180 = 0;
  scale: number;
  tile: numberPair;
  isDouble: boolean;
  _coordinates: numberPair = [0, 0];
  private _connectedAt: number[];
  private _orientationSpec = {
    "0deg": ["top", "bottom", "left", "right"],
    "90deg": ["right", "left", "top", "bottom"],
    "-90deg": ["left", "right", "bottom", "top"],
    "180deg": ["bottom", "top", "right", "left"],
  };
  private GAP = 3;
  private _connectionSpecInternal: (0 | 1)[];

  constructor(tile: tileType, coordinates: numberPair, root: boolean = false) {
    this.id = tile.id;
    this.root = root;
    this.scale = 1;
    this.tile = tile.tile;
    this.isDouble = this.tile[0] === this.tile[1];
    this.coordinates = coordinates;
    this._connectedAt = [];
    this._connectionSpecInternal = this._initializeConnectionSpec();

    console.info(
      `${this.root ? "A root anchor" : "An anchor"} with a ${
        this.isStepper ? "stepper" : this.isDouble ? "double" : "mixed"
      } tile was created at ${this._coordinates}`
    );
  }

  get isStepper() {
    return this.root && this.isDouble;
  }

  private _initializeConnectionSpec(): (0 | 1)[] {
    return this.isStepper
      ? [1, 1, 1, 1]
      : this.isDouble
      ? [0, 0, 1, 1]
      : [1, 1, 0, 0];
  }

  get _connectionSpec(): (0 | 1)[] {
    return this._connectionSpecInternal;
  }

  get coordinates(): numberPair {
    const [val1, val2] = this._coordinates;
    return [val1 - 30, val2 - 60];
  }

  set coordinates(value: numberPair) {
    this._coordinates = value;
  }

  get canAccept() {
    if (this.isDouble) {
      return this._connectionSpec.includes(1) ? [this.tile[0]] : [];
    }

    return this._connectionSpec.reduce((acc: any[], element, i) => {
      if (element) acc.push(this.tile[i]);
      return acc;
    }, []);
  }

  set tilt(value: 0 | 90 | -90 | 180) {
    this._tilt = value;
  }

  get tilt() {
    return this._tilt;
  }

  private _getAvailableDropPosition(
    connectingHalveIndex: number,
    dropSide: string
  ) {
    const orientation = this._orientationSpec[`${this.tilt}deg`];
    const connectingDotCount = this.tile[connectingHalveIndex];
    let actualDropPosition: [string] = [""];
    if (!this.isDouble) {
      if (this._connectionSpec[connectingHalveIndex]) {
        this._connectionSpecInternal[connectingHalveIndex] = 0;
        this._connectedAt.push(connectingDotCount);
        actualDropPosition = [orientation[connectingHalveIndex]];
      } else
        console.error(
          `Couldn't index _connectioSpec with index ${connectingHalveIndex}`
        );
    } else {
      const connectingHalveIndex = orientation.indexOf(dropSide);
      if (this._connectionSpec[connectingHalveIndex]) {
        this._connectionSpecInternal[connectingHalveIndex] = 0;
        this._connectedAt.push(connectingDotCount);
        actualDropPosition = [orientation[connectingHalveIndex]]; // = dropSide
      } else {
        const availableHalveIndex = this._connectionSpec.indexOf(1);
        if (availableHalveIndex !== -1) {
          this._connectionSpecInternal[availableHalveIndex] = 0;
          this._connectedAt.push(connectingDotCount);
          actualDropPosition = [orientation[availableHalveIndex]];
        } else console.error("couldn't find '1' in _connectionSpec");
      }
    }

    console.info(
      `A connection should be made on the ${actualDropPosition} of tile with id ${this.id}`
    );
    return actualDropPosition;
  }

  private _calcBoundingBorder(position: string) {
    let coordinates: numberPair = [0, 0];
    if (this._tilt === 0 || this.tilt === 180) {
      switch (position) {
        case "top":
          coordinates = [
            this._coordinates[0],
            this._coordinates[1] - (60 + this.GAP) * this.scale,
          ];
          break;
        case "bottom":
          coordinates = [
            this._coordinates[0],
            this._coordinates[1] + (60 + this.GAP) * this.scale,
          ];
          break;
        case "left":
          coordinates = [
            this._coordinates[0] - (30 + this.GAP) * this.scale,
            this._coordinates[1],
          ];
          break;
        case "right":
          coordinates = [
            this._coordinates[0] + (30 + this.GAP) * this.scale,
            this._coordinates[1],
          ];
          break;
      }
    } else {
      switch (position) {
        case "top":
          coordinates = [
            this._coordinates[0],
            this._coordinates[1] - (30 + this.GAP) * this.scale,
          ];
          break;
        case "bottom":
          coordinates = [
            this._coordinates[0],
            this._coordinates[1] + (30 + this.GAP) * this.scale,
          ];
          break;
        case "left":
          coordinates = [
            this._coordinates[0] - (60 + this.GAP) * this.scale,
            this._coordinates[1],
          ];
          break;
        case "right":
          coordinates = [
            this._coordinates[0] + (60 + this.GAP) * this.scale,
            this._coordinates[1],
          ];
          break;
      }
    }

    console.info(`Boundary cordinate at ${coordinates}`);
    return coordinates;
  }

  private _calcRelativeDropPosition([cor1, cor2]: numberPair): string {
    const vec = [
      (this._coordinates[0] - cor1) * -1,
      this._coordinates[1] - cor2,
    ] as numberPair;

    let position: string = "";
    const angle = calcVectorAngle(vec, [0, 100]);
    console.log("angle", angle);
    if (angle >= 0 && angle <= 45) position = "top";
    else if (angle > 45 && angle < 135) {
      if (vec[0] > 0) position = "right";
      else position = "left";
    } else position = "bottom";

    console.info(`A tile was dropped at the ${position} of another tile`);
    return position;
  }

  setConnection(tileSpec: TileAlignSpec) {
    const { _coordinates, tile: incomingTile } = tileSpec;
    const relativePosition = this._calcRelativeDropPosition(_coordinates);
    const connectingHalveIndex = this.tile.indexOf(
      this.tile.find((num) => incomingTile.includes(num)) as number
    ) as 0 | 1;
    const availableDropPosition = this._getAvailableDropPosition(
      connectingHalveIndex,
      relativePosition
    );
    const attachBoundaryCoordinates = this._calcBoundingBorder(
      ...availableDropPosition
    );
    const newConnection = new TileAlignSpec(
      { id: tileSpec.id, tile: tileSpec.tile },
      attachBoundaryCoordinates
    );
    const InComingConnectingHalveIndex = incomingTile.indexOf(
      incomingTile.find((num) => this.tile.includes(num)) as number
    ) as 0 | 1;
    newConnection.setIn(
      ...availableDropPosition,
      InComingConnectingHalveIndex,
      this.scale
    );
    return newConnection;
  }

  setIn(conectingPosition: string, connectingHalveIndex: 1 | 0, scale: number) {
    let tilt: 0 | 90 | -90 | 180 = 0;
    let boundaryExtensionCoordinates: numberPair = this._coordinates;

    // Determine tilt and coordinates based on the connecting position and halve index
    if (!connectingHalveIndex) {
      switch (conectingPosition) {
        case "top":
          tilt = 180;
          boundaryExtensionCoordinates[1] -= 60 * scale;
          break;
        case "bottom":
          tilt = 0;
          boundaryExtensionCoordinates[1] += 60 * scale;
          break;
        case "left":
          tilt = 90;
          boundaryExtensionCoordinates[0] -= 60 * scale;
          break;
        case "right":
          tilt = -90;
          boundaryExtensionCoordinates[0] += 60 * scale;
          break;
      }
    } else {
      switch (conectingPosition) {
        case "top":
          tilt = 0;
          boundaryExtensionCoordinates[1] -= 60 * scale;
          break;
        case "bottom":
          tilt = 180;
          boundaryExtensionCoordinates[1] += 60 * scale;
          break;
        case "left":
          tilt = -90;
          boundaryExtensionCoordinates[0] -= 60 * scale;
          break;
        case "right":
          tilt = 90;
          boundaryExtensionCoordinates[0] += (60 + this.GAP) * scale;
          break;
      }
    }

    console.log("conectingPosition", connectingHalveIndex, conectingPosition);

    // Update the tile's coordinates, tilt, and scale
    this.coordinates = boundaryExtensionCoordinates;
    this.tilt = tilt;
    this.scale = scale;

    const sideMap: { [key: string]: string } = {
      top: "bottom",
      bottom: "top",
      left: "right",
      right: "left",
    };

    const oppositeSide = sideMap[conectingPosition];

    // Update connection spec for the new tile
    const orientation = this._orientationSpec[`${this.tilt}deg`];
    const dropSideIndex = orientation.indexOf(oppositeSide);
    const connectingDotCount = this.tile[dropSideIndex];

    if (dropSideIndex !== -1 && this._connectionSpec[dropSideIndex]) {
      this._connectionSpec[dropSideIndex] = 0;
      this._connectedAt.push(connectingDotCount);
    } else {
      console.error(`Invalid drop side index for position: ${oppositeSide}`);
    }

    console.info(
      `Anchor ${this.id} set in at ${this.coordinates} ${oppositeSide}`
    );
  }
}
