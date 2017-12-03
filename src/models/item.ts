/**
 * Model that fill our Master-Detail pages list, create, and delete.
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

  public toString(): string {
    let value = "";
    value = this.name;
    // About
    if (this.about != "") {
      value = value + " [" + this.about+ "] ";
    }
    // Points
    for (var i = 0; i < this.points.length; i++) { 
      value = value + " (" + this.points[i].latitude + ", " + this.points[i].longitude + ")"; 
    }
    // Surface
    value = value + " -> surface: " + this.surface;
    return value;
  }

}
