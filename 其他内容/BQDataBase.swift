//
//  BQDataSourceServer.swift
//  BizQ
//
//  Created by Jose_iOS on 09/04/2020.
//  Copyright © 2020 Gaudi Properties Consulting SL. All rights reserved.
//

import Foundation
import Firebase

class BQDBServer {
    
    private var dbName: String? {
        guard let dirName = directoryName else { return nil }
        if let path = BQFileManegerUtils.getLocalDirectoryPath(with: dirName, routerType: .Contact) {
            return path + "/msg_\(dbIndex).sqlite"
        }
        return nil
    }
    
    private var directoryName: String? {
        guard let id = BQAccountManeger.currentId else { return nil}
        return "\(id)/\(rootMessageDirectoryName)"
    }
    
    private lazy var dbURL: URL = {
        return URL(fileURLWithPath: getLocalDBURL() )
    }()
    
    ///本地数据库 Local DB
    private (set) lazy var db: FMDatabase = {
        let database = FMDatabase(url: dbURL)
        return database
    }()
    
    ///Firebase 数据库
    lazy var fireDBRef: DatabaseReference = {
        Database.database().reference(fromURL: fireDBURL)
    }()
    
    //Queue
    lazy var queue: FMDatabaseQueue? = {
        let queue = FMDatabaseQueue(url: dbURL)
        return queue
    }()
    
    var tables: [BQDataBaseAdapter] = [
        BQConversationTableAdapter(),
        BQConversationUserTableAdapter(),
        BQConversationMessageTableAdapter(),
        BQContactTableAdapter()
    ]
    
    ///Singleton
    static let shared: BQDBServer = BQDBServer()
    private init() { createDatabase() }
    
    private func getLocalDBURL() -> String {
        let path = "\(dbName ?? BQFileManegerUtils.getAppRootPath(routerType: .Contact) + "/tempdb.sqlite")"
        if FileManager.default.fileExists(atPath: path) {
            print("旧数据库地址：", path)
            return path
        }
        FileManager.default.createFile(atPath: path, contents: nil, attributes: nil)
        print("新数据库地址：", path)
        return path
    }
    
    ///当用户切换账号时可调用
    func updateDBWhenUserIsLogin() {
        dbURL = URL(fileURLWithPath: getLocalDBURL())
        db = FMDatabase(url: dbURL)
        queue = FMDatabaseQueue(url: dbURL)
        createDatabase()
    }
    ///初始化创建表
    func createDatabase() {
        guard dbName != nil else { return }
        //open db
        if db.open() {
            for table in tables {
                table.initialTable(with: db)
            }
            checkNewColumName()
        } else {
            print("could not open database start")
        }
    }
    
    private func checkNewColumName() {
        for item in newColums {
            if !db.columnExists(item.name, inTableWithName: item.table) {
                var sql: String = "alter table \(item.table) add \(item.name) \(item.type)"
                if let dfValue = item.default, dfValue.count > 0 {
                    sql = "\(sql) default \(dfValue);"
                }
                db.executeStatements(sql)
            }
        }
    }
    
    private func createGroupTable(groupTableName: String?, completion: (_ isCreated: Bool)->()) {
        guard let name = groupTableName else { completion(false); return }
        if db.isOpen, !db.tableExists(name) {
            ///User table
            var createGroupTable: String {
                "create table user "
                    + "( \(field_id) text not null constraint user_pk primary key, "
                    + "\(field_userId) text not null ); "
                    + "create unique index user_id_uindex on \(name) (\(field_id); "
            }
            do {
                try db.executeUpdate(createGroupTable, values: nil)
                completion(true)
            }catch {
                print(db.lastErrorMessage())
                completion(false)
            }
        }else { completion(false) }
    }
    
    ///Insert DB
    func singleInsert(sql: String) -> Bool{
        if db.open() {
            if !db.executeStatements(sql, withResultBlock: nil) {
                print(db.lastError(), db.lastErrorMessage())
                return false
            }; return true
        }; return false
    }
    
    //批量插入
    func multiInsert(sqls: [String]) {
        guard let queue = queue else { return }
        if db.isOpen {
            queue.inTransaction { (db, rollback) in
                do { for index in 0 ..< sqls.count {
                    try db.executeUpdate(sqls[index], values: nil) }
                    print("insert successful")
                }catch { print("insert error"); rollback.pointee = true }
            }
        }
    }
    
    //Query (Load data)
    func query(sql: String) -> FMResultSet? {
        if db.isOpen {
            return try? db.executeQuery(sql, values: nil)
        }
        return nil
    }
    
    ///更新数据
    func update(sql: String) -> Bool{
        if db.isOpen {
            do {
               try db.executeUpdate(sql, values: nil)
                return true
            }catch { print(db.lastErrorMessage()) }
        }
        return false
    }
    
}


//
//  BQDBConstant.swift
//  BizQ
//
//  Created by Jose_iOS on 11/11/2020.
//  Copyright © 2020 Gaudi Properties Consulting SL. All rights reserved.
//

import Foundation

//MARK: - 消息状态
///cn ~ 消息状态, en ~ Message state
enum BQMessageStatusType: String {
    case unSend
    case sending
    case hasSent
    case received
    case isRead
}
/// cn ~ 消息类型, en ~ Message type
enum BQMessageType: String, Codable {
    case text, image, audio, location, order, preOrder, payment, product, card, contact
    case system, pdf
    case initializePayment
    case shipment, `return`, outOfStock 
    case coupon, voucher
    
    var content: String {
        switch self {
        case .text:     return "[Text]"
        case .image:    return bqImageNotify
        case .audio:    return bqAudioNotify
        case .location: return bqLocationNotify
        case .order:    return bqOrderNotify
        case .preOrder: return bqReservationNotify
        case .payment:  return bqPaymentNotify
        case .product:  return bqProductNotify
        case .card:     return "[Card]"
        case .contact:  return bqContactNotify
        case .system:   return bqSystemNotify
        case .pdf:      return bqFileNotify
        case .initializePayment: return bqInitializePaymentNotify
        case .shipment: return bqShipmentNotify
        case .return:   return bqReturnNotify
        case .outOfStock: return bqOutOfStockNotify
        case .coupon:   return bqCouponNotify
        case .voucher:  return bqVoucherNotify
        }
    }
}

//MARK: - Table Colum Name
let field_id = "id"
let field_avatar = "avatar"
let field_title = "name"
let field_isShop = "isShop"

let field_isGrouped = "isGrouped"
let field_sender = "senderId"
let field_receive = "receiveId"
let field_userId = "userId"
let field_isSpam = "isSpam"
let field_users = "users"
let field_separator = "#$"

let field_creator = "creator"
let field_updater = "updater"

let field_senderUser = "senderUser"
let field_receiveUser = "receiveUser"

let field_conversationId = "conversationId"
let field_content = "content"
let field_filePath = "filePath"
let field_recorder_time = "recorderTime"
let field_message_status = "status"
let field_msgType = "type"
let field_timestamp = "timestamp"
let field_real_timestamp = "realTimestamp"
let field_reference_content = "referenceMessageContent"
let field_reference_id = "referenceMessageId"
let field_reference_type = "referenceMessageType"
let field_reference_sender = "referenceMessageSender"
let field_reference_senderId = "referenceMessageSenderId"
let field_unRead_count = "unReadCount"

//Diffsion
let field_isDiffusion = "isDiffusion"
let field_diffusion_alia = "alia"

//Contacts
/*
 (id, name, isShop, remark, id, image, note, friendID)
 */
let field_remark = "remark"
let field_image = "image"
let field_note = "note"
let field_friendID = "friendID"

//Tables Name
let field_message_user_table = "\(BQConversationUser.self)"
let field_message_conversation_table = "\(BQConversation.self)"
let field_message_message_table = "\(BQConversationMessage.self)"
let field_contact_table = "\(BQContactInfoModel.self)"
var dbIndex: Int = 0

//MARK: new colum set
typealias BQDBNewColum = (name: String, table: String, type: String, `default`: String?)
//New Colums To Conversation DB
let newColums = [
    (name: field_isDiffusion, table: field_message_conversation_table, type: "boolean", default: "0"),
    (name: field_diffusion_alia, table: field_message_conversation_table, type: "text", default: nil),
    (name: field_isGrouped, table: field_message_user_table, type: "boolean", default: "0"),
    (name: field_creator, table: field_message_conversation_table, type: "text", default: nil),
    (name: field_updater, table: field_message_conversation_table, type: "text", default: nil),
    (name: field_isSpam, table: field_message_conversation_table, type: "boolean", default: "0"),
    (name: field_remark, table: field_message_user_table, type: "text", default: nil),
    (name: field_note, table: field_message_user_table, type: "text", default: nil),
    (name: field_users, table: field_message_conversation_table, type: "text", default: nil)
]

//MARK: 稍微处理一下 table
protocol BQDataBaseAdapter {
    var tableName: String { get }
    var statemente: String { get }
}

//MARK: Adapter
extension BQDataBaseAdapter {
    func initialTable(with db: FMDatabase) {
        do {
            if !db.tableExists(tableName) {
                try db.executeUpdate(statemente, values: nil) }
        }catch {
            print(db.lastErrorMessage())
        }
    }
}

struct BQContactTableAdapter: BQDataBaseAdapter {
    var tableName: String { field_contact_table }
    var statemente: String  {
            "create table \(tableName) "
                + "( \(field_id) text not null constraint user_pk primary key, "
                + "\(field_title) text, "
                + "\(field_isShop) boolean default 0, "
                + "\(field_remark) text, "
                + "\(field_note) text, "
                + "\(field_friendID) text, "
                + "\(field_image) text ); "
                + "create unique index user_id_uindex on \(tableName) (\(field_id); "
        }
}

struct BQConversationUserTableAdapter: BQDataBaseAdapter {
    var tableName: String { field_message_user_table }
    var statemente: String  {
            "create table \(tableName) "
                + "( \(field_id) text not null constraint user_pk primary key, "
                + "\(field_title) text, "
                + "\(field_isShop) boolean default 0, "
                + "\(field_isGrouped) boolean default 0, "
                + "\(field_avatar) text ); "
                + "create unique index user_id_uindex on \(tableName) (\(field_id); "
        }
}

struct BQConversationTableAdapter: BQDataBaseAdapter {
    var tableName: String { field_message_conversation_table }
    var statemente: String {
        "create table \(tableName) "
            + "( \(field_id) text constraint conversation_pk primary key, "
            + "\(field_isGrouped) boolean default 0, "
            + "\(field_receive) text, "
            + "\(field_diffusion_alia) text, "
            + "\(field_timestamp) text, "
            + "\(field_unRead_count) int default 0, "
            + "\(field_isDiffusion) boolean default 0,"
            + "\(field_isSpam) boolean default 0,"
            + "constraint conversation_user_fk "
            + "foreign key (\(field_receive)) references user (\(field_id))); "
            + "create unique index conversation_id_uindex on \(tableName) (\(field_id));"
    }
    
}

struct BQConversationMessageTableAdapter: BQDataBaseAdapter {
    var tableName: String {field_message_message_table}
    
    var statemente: String {
        "create table \(tableName) "
            + "( \(field_id) text not null constraint message_pk primary key, "
            + "\(field_conversationId) text not null references \(field_message_conversation_table), "
            + "\(field_content) text, "
            + "\(field_filePath) text, "
            + "\(field_recorder_time) double, "
            + "\(field_message_status) text default \(BQMessageStatusType.sending.rawValue), "
            + "\(field_msgType) text default 'text', "
            + "\(field_sender) text, "
            + "\(field_reference_id) text, "
            + "\(field_reference_type) text, "
            + "\(field_reference_sender) text, "
            + "\(field_reference_senderId) text, "
            + "\(field_reference_content) text, "
            + "\(field_timestamp) text ); "
            + "create unique index message_id_uindex on \(tableName) (\(field_id));"
    }
}


//
//  BQSQLModel.swift
//  BizQ
//
//  Created by Jose_iOS on 25/04/2020.
//  Copyright © 2020 Gaudi Properties Consulting SL. All rights reserved.
//

import Foundation

protocol SQLModelProtocol {}
 
// 数据库模型（一张表对应一个模型）
@objcMembers
class SQLModel: NSObject, SQLModelProtocol {
    
    // 模型对应的表名（直接使用对应模型类名字）
    internal var table = ""
     
    // 记录每个模式对应的数据表是否已经创建完毕了
    private static var verified = [String:Bool]()
     
    // 初始化方法
    required override init() {
        super.init()
        // 自动初始化表名
        if table.count == 0 {
            self.table = type(of: self).table
        }
        // 自动建对应的数据库表
        if !BQDBServer.shared.db.tableExists(table) {
            let verified = SQLModel.verified[self.table]
            if verified == nil || !verified! {
                let db = BQDBServer.shared.db
                var sql = "CREATE TABLE IF NOT EXISTS \(table) ("
                // Columns
                let cols = values()
                var first = true
                for col in cols {
                    if first {
                        first = false
                        sql += getColumnSQL(column:col)
                    } else {
                        sql += ", " + getColumnSQL(column: col)
                    }
                }
                // Close query
                sql += ")"
                if db.open() {
                    if db.executeUpdate(sql, withArgumentsIn:[]) {
                        SQLModel.verified[table] = true
                        print("\(table) 数据表创建成功")
                    }
                }
            }
        }
    }
     
    // 返回主键字段名（如果模型主键不是id，则需要覆盖这个方法）
    func primaryKey() -> String {
        return "id"
    }
     
    // 忽略的属性（模型中不需要与数据库表进行映射的字段可以在这里发返回）
    func ignoredKeys() -> [String] {
        return []
    }
     
    // 静态方法返回表名
    static var table:String {
        // 直接返回类名字
        return "\(classForCoder())"
    }
     
    // 删除指定数据（可附带条件）
    @discardableResult
    class func remove(filter: String = "") -> Bool {
        let db = BQDBServer.shared.db
        var sql = "DELETE FROM \(table)"
        if !filter.isEmpty {
            // 添加删除条件
            sql += " WHERE \(filter)"
        }
        if db.open() {
            return db.executeUpdate(sql, withArgumentsIn:[])
        } else {
            return false
        }
    }
     
    // 获取数量（可附带条件）
    class func count(filter: String = "") -> Int {
        let db = BQDBServer.shared.db
        var sql = "SELECT COUNT(*) AS count FROM \(table)"
        if !filter.isEmpty {
            // 添加查询条件
            sql += " WHERE \(filter)"
        }
        if let res = db.executeQuery(sql, withArgumentsIn: []) {
            if res.next() {
                return Int(res.int(forColumn: "count"))
            } else {
                return 0
            }
        }
        return 0
    }
     
    /// 保存当前对象数据
    /// * 如果模型主键为空或者使用该主键查不到数据则新增
    /// * 否则的话则更新
    @discardableResult
    func save() -> Bool{
        let key = primaryKey()
        let data = values()
        var insert = true
        let db = BQDBServer.shared.db
         
        if let rid = data[key] {
            var val = "\(rid)"
            if rid is String {
                val = "'\(rid)'"
            }
            let sql = "SELECT COUNT(*) AS count FROM \(table) "
                + "WHERE \(primaryKey())=\(val)"
            if db.open() {
                if let res = db.executeQuery(sql, withArgumentsIn: []) {
                    if res.next() {
                        insert = res.int(forColumn: "count") == 0
                    }
                }
            }
        }
         
        let (sql, params) = getSQL(data:data, forInsert:insert)
        // 执行SQL语句
         
        if db.open() {
            return db.executeUpdate(sql, withArgumentsIn: params ?? [])
        } else {
            return false
        }
    }
     
    // 删除当前对象数据
    @discardableResult
    func delete() -> Bool{
        let key = primaryKey()
        let data = values()
        let db = BQDBServer.shared.db
        if let rid = data[key] {
            if db.open() {
                let sql = "DELETE FROM \(table) WHERE \(primaryKey())='\(rid)'"
                return db.executeUpdate(sql, withArgumentsIn: [])
            }
        }
        return false
    }
     
    // 通过反射获取对象所有有的属性和属性值
    internal func values() -> [String: Any] {
        var res: [String: Any] = [:]
        let obj = Mirror(reflecting:self)
        processMirror(obj: obj, results: &res)
        getValues(obj: obj.superclassMirror, results: &res)
        return res
    }
     
    // 供上方方法（获取对象所有有的属性和属性值）调用
    private func getValues(obj: Mirror?, results: inout [String: Any]) {
        guard let obj = obj else { return }
        processMirror(obj: obj, results: &results)
        getValues(obj: obj.superclassMirror, results: &results)
    }
     
    // 供上方方法（获取对象所有有的属性和属性值）调用
    private func processMirror(obj: Mirror, results: inout [String: Any]) {
        for (_, attr) in obj.children.enumerated() {
            if let name = attr.label {
                // 忽略 table 和 db 这两个属性
                if name == "table" || name == "db" {
                    continue
                }
                // 忽略人为指定的属性
                if ignoredKeys().contains(name) ||
                    name.hasSuffix(".storage") {
                    continue
                }
                results[name] = unwrap(attr.value)
            }
        }
    }
     
    //将可选类型（Optional）拆包
    func unwrap(_ any:Any) -> Any {
        let mi = Mirror(reflecting: any)
        if mi.displayStyle != .optional {
            return any
        }
         
        if mi.children.count == 0 { return any }
        let (_, some) = mi.children.first!
        return some
    }
     
    // 返回新增或者修改的SQL语句
    private func getSQL(data:[String:Any], forInsert:Bool = true)
        -> (String, [Any]?) {
        var sql = ""
        var params:[Any]? = nil
        if forInsert {
            sql = "INSERT INTO \(table)("
        } else {
            sql = "UPDATE \(table) SET "
        }
        let pkey = primaryKey()
        var wsql = ""
        var rid:Any?
        var first = true
        for (key, val) in data {
            // 处理主键
            if pkey == key {
                if forInsert {
                    if val is Int && (val as! Int) == -1 {
                        continue
                    }
                } else {
                    wsql += " WHERE " + key + " = ?"
                    rid = val
                    continue
                }
            }
            // 设置参数
            if first && params == nil {
                params = [AnyObject]()
            }
            if forInsert {
                sql += first ? "\(key)" : ", \(key)"
                wsql += first ? " VALUES (?" : ", ?"
                params!.append(val)
            } else {
                sql += first ? "\(key) = ?" : ", \(key) = ?"
                params!.append(val)
            }
            first = false
        }
        // 生成最终的SQL
        if forInsert {
            sql += ")" + wsql + ")"
        } else if params != nil && !wsql.isEmpty {
            sql += wsql
            params!.append(rid!)
        }
        return (sql, params)
    }
     
    // 返回建表时每个字段的sql语句
    private func getColumnSQL(column:(key: String, value: Any)) -> String {
        let key = column.key
        let val = column.value
        var sql = "'\(key)' "
        if val is Int {
            // 如果是Int型
            sql += "INTEGER"
            if key == primaryKey() {
                sql += " PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE"
            } else {
                sql += " DEFAULT \(val)"
            }
        } else {
            // 如果是其它类型
            if val is Float || val is Double {
                sql += "REAL DEFAULT \(val)"
            } else if val is Bool {
                sql +=  "BOOLEAN DEFAULT \(val as! Bool ? 1 : 0)"
            } else if val is Date {
                sql += "DATE"
            } else if val is NSData {
                sql += "BLOB"
            } else {
                // Default to text
                sql += "TEXT"
            }
            if key == primaryKey() {
                sql += " PRIMARY KEY NOT NULL UNIQUE"
            }
        }
        return sql
    }
}
 
extension SQLModelProtocol where Self: SQLModel {
    // 根据完成的sql返回数据结果
    static func rowsFor(sql: String = "") -> [Self] {
        var result = [Self]()
        let tmp = self.init()
        let data = tmp.values()
        let db = BQDBServer.shared.db
        let fsql = sql.isEmpty ? "SELECT * FROM \(table)" : sql
        if let res = db.executeQuery(fsql, withArgumentsIn: []){
            // 遍历输出结果
            while res.next() {
                let t = self.init()
                for (key, _) in data {
                    if let val = res.object(forColumn: key), !(val is NSNull) {
                        t.setValue(val, forKey:key)
                    }
                }
                result.append(t)
            }
        }else{
            print("查询失败")
        }
        return result
    }
     
    // 根据指定条件和排序算法返回数据结果
    static func rows(filter: String = "", order: String = "",
                     limit: Int = 0) -> [Self] {
        var sql = "SELECT * FROM \(table)"
        if !filter.isEmpty {
            sql += " WHERE \(filter)"
        }
        if !order.isEmpty {
            sql += " ORDER BY \(order)"
        }
        if limit > 0 {
            sql += " LIMIT 0, \(limit)"
        }
        return self.rowsFor(sql:sql)
    }
    
    
}


//
//  BQFirebaseDBServer.swift
//  BizQ
//
//  Created by Jose_iOS on 12/04/2020.
//  Copyright © 2020 Gaudi Properties Consulting SL. All rights reserved.
//

import Foundation

extension BQDBServer {
    enum FirebaseUserConnection: String {
        case system
        case stranger
        case null
    }
    
    enum FirebaseUserStatus: String {
        case online
        case offline
        case busy
        case other
    }
    
    func updateUserStatus(state: FirebaseUserStatus) {
        guard let currentId = BQAccountManeger.currentId else { return }
        BQDBServer.shared.fireDBRef.child(field_message_user_table).child(currentId).child(FirebaseConstants.field_observe_status).child(FirebaseConstants.field_status).setValue(state.rawValue)
    }
    
    func updateUserConnection(to destinationId: String) {
        guard let currentId = BQAccountManeger.currentId else { return }
        BQDBServer.shared.fireDBRef
            .child(field_message_user_table)
            .child(currentId)
            .child(FirebaseConstants.field_current_connection)
            .setValue(destinationId)
    }
    
}struct FirebaseConstants {
    // Firebase Keys
    static let field_observe_conversation = "observeConversations"
    static let field_observe_status = "observeStatus"
    static let field_conversation_status = "conversationStatus"
    static let field_status = "currentStatus"
    static let field_current_connection = "currentConnection"
    static let field_delete_message = "deleteMessages"
}