import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { ToastController, Events } from 'ionic-angular';

import { Item } from '../../models/item';

const DATABASE_FILE_NAME: string = 'data.db';

@Injectable()
export class Items { 
  
  private items: Item[] = [];
  private db: SQLiteObject;

  defaultItem: any = {
    "rowid": 0,
    "name": "Unknow",
    "about": "",
    "image": "",
    "points": [],
    "surface": 0,
    "step": 0
  };


  constructor(private sqlite: SQLite, private toastCtrl: ToastController, public events: Events) {
   this.createDatabaseFile();    
  }

  private presentToast(message: string) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'top'
    });  
    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });  
    toast.present();
  }

  private createDatabaseFile(): void { 
    this.sqlite.create({
      name: DATABASE_FILE_NAME,
      location: 'default'
    })
      .then((db: SQLiteObject) => {
        console.debug('Database: ' + DATABASE_FILE_NAME);
        this.db = db;
        this.createTables();
      })
      .catch(e => this.presentToast(e.message)); 
  }

  private createTables(): void {
    this.db.executeSql('CREATE TABLE IF NOT EXISTS "pieces" ( `rowid` INTEGER PRIMARY KEY AUTOINCREMENT, `name` TEXT NOT NULL, `about` TEXT NOT NULL, `image` BLOB, `points` BLOB, `surface` REAL NOT NULL DEFAULT 0, `step` INTEGER NOT NULL DEFAULT 0  ) ;', {})
      .then(() => {
        console.debug('Table "pieces" OK');
        this.getData();
      })
      .catch(e => this.presentToast(e.message));
  }

  public getData(): Item[] {
      this.db.executeSql('SELECT * FROM pieces ORDER BY name ASC ;', {})
      .then((data: any) => { 
        this.items = [];
        console.debug(data.rows.length);
        for(var i=0; i<data.rows.length; i++) { 
          let row = data.rows.item(i);
          let item = new Item();
          item.rowid = row.rowid;
          item.name = row.name;          
          if (row.about != NaN) {
            item.about = row.about;
          }
          item.image = row.image;

          ///this.presentToast("row.points = " + row.points);
          let sql_points = JSON.parse(row.points);          
          if (sql_points != null) {
            for(var j=0; j<sql_points.length; j++) {
              ///this.presentToast("item.points.latitude = " + sql_points[j].latitude);
              item.addPoint(sql_points[j].latitude, sql_points[j].longitude);
            }
          }

          item.surface = row.surface; 
          item.step = row.step;

          //this.presentToast("getData() " + item); 
          this.items.push(item);
        }
        this.events.publish('items:loaded', this.items, Date.now());
      })
      .catch(e => this.presentToast(e.message));  
    return this.items;
  }



  public query(params?: any): Item[] {
    if (!params) {
      return this.items;
    }
    return this.items.filter((item) => {
      for (let key in params) {
        let field = item[key];
        if (typeof field == 'string' && field.toLowerCase().indexOf(params[key].toLowerCase()) >= 0) {
          return item;
        } else if (field == params[key]) {
          return item;
        }
      }
      return null; 
    });
  }

  public add(item: Item) {
    let data = [item.name, item.about, item.image, JSON.stringify(item.points), item.surface ? item.surface : 0, item.step ? item.step : 0];    
    this.db.executeSql('INSERT INTO pieces (name, about, image, points, surface, step) VALUES (?, ?, ?, ?, ?, ?) ;', data)
      .then((res) => {
        item.rowid = res.insertId;
        this.items.push(item); 
      })
      .catch(e => this.presentToast(e.message));
  }

  /*
  public save(item: Item) {
    let data = [item.name, item.about, item.image, JSON.stringify(item.points), item.surface ? item.surface : 0, item.step ? item.step : 0, item.rowid];    
    this.db.executeSql('UPDATE pieces SET name=?, about=?, image=?, points=?, surface=?, step=? WHERE rowid=?   ;', data)
      .then(() => console.log('Piece "'+item.name+'" updated'))
      .catch(e => this.presentToast(e.message));
  }
  */
  public save(item: Item): Promise<string> {
    let promise = new Promise<string>((resolve, reject) => {
      try {
        let data = [item.name, item.about, item.image, JSON.stringify(item.points), item.surface ? item.surface : 0, item.step ? item.step : 0, item.rowid];    
        this.db.executeSql('UPDATE pieces SET name=?, about=?, image=?, points=?, surface=?, step=? WHERE rowid=?   ;', data)
          .then(() => console.log('Piece "'+item.name+'" updated'))
          .catch(e => this.presentToast(e.message));
        resolve('Item saved');    
      } catch (error) {
        reject('Error saving item: ' + error.message);  
      }
    });  
    return promise; 
  }

  public delete(item: Item) {
    let data = [item.rowid];    
    this.db.executeSql('DELETE FROM pieces WHERE rowid=? ;', data)
    .then(() => {
      console.log('Piece "'+item.name+'" deleted');
      this.items.splice(this.items.indexOf(item), 1);      
    })
    .catch(e => this.presentToast(e.message));
}



}
