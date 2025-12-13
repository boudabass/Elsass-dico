# Référence API : Fichiers et Structures de Données

## Fonction : loadJSON(path, [successCallback], [errorCallback])
Loads a JSON file to create an `Object`.

@method loadJSON
@param  {String} path path of the JSON file to be loaded.
@param  {function} [successCallback] function to call once the data is loaded. Will be passed the object.
@param  {function} [errorCallback] function to call if the data fails to load. Will be passed an `Error` event object.
@return {Object} object containing the loaded data.

---

## Fonction : loadStrings(path, [successCallback], [errorCallback])
Loads a text file to create an `Array`.

@method loadStrings
@param  {String} path path of the text file to be loaded.
@param  {function} [successCallback] function to call once the data is
                                      loaded. Will be passed the array.
@param  {function} [errorCallback] function to call if the data fails to
                                    load. Will be passed an `Error` event
                                    object.
@return {String[]} new array containing the loaded text.

---

## Fonction : loadTable(filename, [extension], [header], [callback], [errorCallback])
Reads the contents of a file or URL and creates a <a href="#/p5.Table">p5.Table</a> object with
its values.

@method loadTable
@param  {String}         filename    name of the file or URL to load
@param  {String}         [extension] parse the table by comma-separated values "csv", semicolon-separated
                                      values "ssv", or tab-separated values "tsv"
@param  {String}         [header]    "header" to indicate table has header row
@param  {function}       [callback]  function to be executed after
                                      <a href="#/p5/loadTable">loadTable()</a> completes. On success, the
                                      <a href="#/p5.Table">Table</a> object is passed in as the
                                      first argument.
@param  {function}  [errorCallback]  function to be executed if
                                      there is an error, response is passed
                                      in as first argument
@return {Object}                     <a href="#/p5.Table">Table</a> object containing data

---

## Fonction : loadXML(path, [successCallback], [errorCallback])
Loads an XML file to create a <a href="#/p5.XML">p5.XML</a> object.

@method loadXML
@param  {String} path path of the XML file to be loaded.
@param  {function} [successCallback] function to call once the data is
                                      loaded. Will be passed the
                                      <a href="#/p5.XML">p5.XML</a> object.
@param  {function} [errorCallback] function to call if the data fails to
                                    load. Will be passed an `Error` event
                                    object.
@return {p5.XML} XML data loaded into a <a href="#/p5.XML">p5.XML</a>
                  object.

---

## Fonction : loadBytes(file, [callback], [errorCallback])
This method is suitable for fetching files up to size of 64MB.

@method loadBytes
@param {string}   file            name of the file or URL to load
@param {function} [callback]      function to be executed after <a href="#/p5/loadBytes">loadBytes()</a>
                                    completes
@param {function} [errorCallback] function to be executed if there
                                    is an error
@returns {Object} an object whose 'bytes' property will be the loaded buffer

---

## Fonction : httpGet(path, [datatype], [data], [callback], [errorCallback])
Method for executing an HTTP GET request.

@method httpGet
@param  {String}        path       name of the file or url to load
@param  {String}        [datatype] "json", "jsonp", "binary", "arrayBuffer",
                                    "xml", or "text"
@param  {Object|Boolean} [data]    param data passed sent with request
@param  {function}      [callback] function to be executed after
                                    <a href="#/p5/httpGet">httpGet()</a> completes, data is passed in
                                    as first argument
@param  {function}      [errorCallback] function to be executed if
                                    there is an error, response is passed
                                    in as first argument
@return {Promise} A promise that resolves with the data when the operation
                   completes successfully or rejects with the error after
                   one occurs.

---

## Fonction : httpPost(path, [datatype], [data], [callback], [errorCallback])
Method for executing an HTTP POST request.

@method httpPost
@param  {String}        path       name of the file or url to load
@param  {String}        [datatype] "json", "jsonp", "xml", or "text".
                                    If omitted, <a href="#/p5/httpPost">httpPost()</a> will guess.
@param  {Object|Boolean} [data]    param data passed sent with request
@param  {function}      [callback] function to be executed after
                                    <a href="#/p5/httpPost">httpPost()</a> completes, data is passed in
                                    as first argument
@param  {function}      [errorCallback] function to be executed if
                                    there is an error, response is passed
                                    in as first argument
@return {Promise} A promise that resolves with the data when the operation
                   completes successfully or rejects with the error after
                   one occurs.

---

## Fonction : httpDo(path, [method], [datatype], [data], [callback], [errorCallback])
Method for executing an HTTP request.

@method httpDo
@param  {String}        path       name of the file or url to load
@param  {String}        [method]   either "GET", "POST", or "PUT",
                                    defaults to "GET"
@param  {String}        [datatype] "json", "jsonp", "xml", or "text"
@param  {Object}        [data]     param data passed sent with request
@param  {function}      [callback] function to be executed after
                                    <a href="#/p5/httpGet">httpGet()</a> completes, data is passed in
                                    as first argument
@param  {function}      [errorCallback] function to be executed if
                                    there is an error, response is passed
                                    in as first argument
@return {Promise} A promise that resolves with the data when the operation
                   completes successfully or rejects with the error after
                   one occurs.

---

## Fonction : createWriter(name, [extension])
Creates a new <a href="#/p5.PrintWriter">p5.PrintWriter</a> object.

@method createWriter
@param {String} name name of the file to create.
@param {String} [extension] format to use for the file.
@return {p5.PrintWriter} stream for writing data.

---

## Classe : p5.PrintWriter
A class to describe a print stream.

@class p5.PrintWriter
@param  {String} filename name of the file to create.
@param  {String} [extension] format to use for the file.

### Méthodes d'Instance
- write(data: String|Number|Array): void (Writes data without new lines.)
- print(data: String|Number|Array): void (Writes data with new lines added.)
- clear(): void (Clears all data from the print stream.)
- close(): void (Saves the file and closes the print stream.)

---

## Fonction : save([objectOrFilename], [filename], [options])
Saves a given element(image, text, json, csv, wav, or html) to the client's computer.

@method save
@param  {Object|String} [objectOrFilename]
@param  {String} [filename]
@param  {Boolean|String} [options]

---

## Fonction : saveJSON(json, filename, [optimize])
Saves an `Object` or `Array` to a JSON file.

@method saveJSON
@param  {Array|Object} json data to save.
@param  {String} filename name of the file to be saved.
@param  {Boolean} [optimize] whether to trim unneeded whitespace. Defaults
                              to `true`.

---

## Fonction : saveStrings(list, filename, [extension], [isCRLF])
Saves an `Array` of `String`s to a file, one per line.

@method saveStrings
@param  {String[]} list data to save.
@param  {String} filename name of file to be saved.
@param  {String} [extension] format to use for the file.
@param  {Boolean} [isCRLF] whether to add `\r\n` to the end of each
                             string. Defaults to `false`.

---

## Fonction : saveTable(Table, filename, [options])
Writes the contents of a <a href="#/p5.Table">Table</a> object to a file.

@method saveTable
@param  {p5.Table} Table  the <a href="#/p5.Table">Table</a> object to save to a file
@param  {String} filename the filename to which the Table should be saved
@param  {String} [options]  can be one of "tsv", "csv", or "html"

---

## Classe : p5.Table
<a href="#/p5.Table">Table</a> objects store data with multiple rows and columns, much like in a traditional spreadsheet.

@class p5.Table
@constructor
@param  {p5.TableRow[]}     [rows] An array of p5.TableRow objects

### Méthodes d'Instance
- addRow([row]): p5.TableRow
- removeRow(id: Integer): void
- getRow(rowID: Integer): p5.TableRow
- getRows(): p5.TableRow[]
- findRow(value: String, column: Integer|String): p5.TableRow
- findRows(value: String, column: Integer|String): p5.TableRow[]
- matchRow(regexp: String|RegExp, column: String|Integer): p5.TableRow
- matchRows(regexp: String, [column: String|Integer]): p5.TableRow[]
- getColumn(column: String|Number): Array
- clearRows(): void
- addColumn([title: String]): void
- getColumnCount(): Integer
- getRowCount(): Integer
- removeTokens(chars: String, [column: String|Integer]): void
- trim([column: String|Integer]): void
- removeColumn(column: String|Integer): void
- set(row: Integer, column: String|Integer, value: String|Number): void
- setNum(row: Integer, column: String|Integer, value: Number): void
- setString(row: Integer, column: String|Integer, value: String): void
- get(row: Integer, column: String|Integer): String|Number
- getNum(row: Integer, column: String|Integer): Number
- getString(row: Integer, column: String|Integer): String
- getObject([headerColumn: String]): Object
- getArray(): Array

---

## Classe : p5.TableRow
A TableRow object represents a single row of data values, stored in columns, from a table.

@class p5.TableRow
@constructor
@param {String} [str] optional: populate the row with a string of values, separated by the separator
@param {String} [separator] comma separated values (csv) by default

### Méthodes d'Instance
- set(column: String|Integer, value: String|Number): void
- setNum(column: String|Integer, value: Number|String): void
- setString(column: String|Integer, value: String|Number|Boolean|Object): void
- get(column: String|Integer): String|Number
- getNum(column: String|Integer): Number
- getString(column: String|Integer): String

---

## Classe : p5.XML
A class to describe an XML object.

@class p5.XML
@constructor

### Méthodes d'Instance
- getParent(): p5.XML
- getName(): String
- setName(name: String): void
- hasChildren(): boolean
- listChildren(): String[]
- getChildren([name: String]): p5.XML[]
- getChild(name: String|Integer): p5.XML
- addChild(child: p5.XML): void
- removeChild(name: String|Integer): void
- getAttributeCount(): Integer
- listAttributes(): String[]
- hasAttribute(name: String): boolean
- getNum(name: String, [defaultValue: Number]): Number
- getString(name: String, [defaultValue: Number]): String
- setAttribute(name: String, value: Number|String|Boolean): void
- getContent([defaultValue: String]): String
- setContent(content: String): void
- serialize(): String

---

## Classe : p5.TypedDict
Base class for all p5.Dictionary types. Specifically typed Dictionary classes inherit from this class.

@class p5.TypedDict
@constructor

### Méthodes d'Instance
- size(): Integer
- hasKey(key: Number|String): Boolean
- get(key: Number|String): Number|String
- set(key: Number|String, value: Number|String): void
- create(key: Number|String, value: Number|String): void
- clear(): void
- remove(key: Number|String): void
- print(): void
- saveTable(filename: String): void
- saveJSON(filename: String, opt: Boolean): void

---

## Classe : p5.StringDict
A simple Dictionary class for Strings.

@class p5.StringDict
@extends p5.TypedDict

---

## Classe : p5.NumberDict
A simple Dictionary class for Numbers.

@class p5.NumberDict
@extends p5.TypedDict

### Méthodes d'Instance
- add(key: Number, amount: Number): void
- sub(key: Number, amount: Number): void
- mult(key: Number, amount: Number): void
- div(key: Number, amount: Number): void
- minValue(): Number
- maxValue(): Number
- minKey(): Number
- maxKey(): Number