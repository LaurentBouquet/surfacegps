/**
 * A generic model that our Master-Detail pages list, create, and delete.
 *
 * Change "Item" to the noun your app will use. For example, a "Contact," or a
 * "Customer," or a "Animal," or something like that.
 *
 * The Items service manages creating instances of Item, so go ahead and rename
 * that something that fits your app as well.
 */

export class Point {
  latitude: number;
  longitude: number;
  
  constructor(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
  }

  public toString(): string {
    let value = "";
    value = "latitude: " + this.latitude + " - longitude: " + this.longitude ;
    return value;
  }

}

export class Item {
  rowid: number;
  name: string = "";
  about: string = "";
  image: HTMLImageElement;
  points: Point[] = [];
  surface: number = 0;
  step: number = 0;

  constructor() {
    // Quick and dirty extend/assign fields to this model
    /*for (const f in fields) {
      this[f] = fields[f];
    }*/
    this.rowid = 0;
    this.name = "";
    this.about = "";
    //this.image = new HTMLImageElement();
    this.points = [];
    this.surface = 0;
    this.step = 0;
  }

  public addPoint(latitude, longitude) {
    if (this.points == null) {
      this.points = [];
    }
    this.points.push(new Point(latitude, longitude));
  }

  /*
  public calcSurface(): string {
    let value: string = "";
    for (var i = 0; i < this.points.length; i++) { 
      value = value + "(" + this.points[i].latitude + ", " + this.points[i].longitude + ") "; 
    }
    return value;
  }
  */

  public toString(): string {
    let value = "";
    value = this.name;

    //about
    if (this.about != "") {
      value = value + " [" + this.about+ "] ";
    }

    //points
    for (var i = 0; i < this.points.length; i++) { 
      value = value + " (" + this.points[i].latitude + ", " + this.points[i].longitude + ")"; 
    }

    //surface
    value = value + " -> surface: " + this.surface;

    return value;
  }

}
