//
//  BQContactInfoModel.swift
//  BizQ
//
//  Created by Jose_iOS on 08/04/2020.
//  Copyright © 2020 Gaudi Properties Consulting SL. All rights reserved.
//

import Foundation
// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let bQContactInfoModel = try? newJSONDecoder().decode(BQContactInfoModel.self, from: jsonData)

import Foundation

// MARK: - BQContactInfoModel
class BQContactInfoList: Codable {
    var contacts: [BQContactInfoModel]?
    var title: String = "#"
    enum CodingKeys: String, CodingKey {
        case contacts
    }
    init(contacts: [BQContactInfoModel]?) {
        self.contacts = contacts
    }
}

class BQContactApplyList: Codable {
    let contactRequests: [BQContactInfoModel]?
    
    enum CodingKeys: String, CodingKey {
        case contactRequests
    }
    
    init(contactRequests: [BQContactInfoModel]?) {
        self.contactRequests = contactRequests
    }
}

// MARK: - Contact
class BQContactInfoModel: SQLModel, Codable {
    
    static func == (lhs: BQContactInfoModel, rhs: BQContactInfoModel) -> Bool {
        if (lhs.friend?.name ?? "#").elementsEqual("#") { return false }
        if (rhs.friend?.name ?? "#").elementsEqual("#") { return true }
        return (lhs.friend?.name ?? "#") < (rhs.friend?.name ?? "#")
    }
    
    let isBlocked: Bool?
    let groups: [BQContactGroupModel]?
    let ownerID: String?
    let ownerType, friendType: BQUserType?
    let createdAt: String?
    let employeeRemarks: [String]?
    var friend: BQUserInfoModel?
    var forwardSelected: Bool = false
    var isSelected: Bool = false
    var remark: String?
    var note: String?
    
    let allowedPrivatePublication: Int?
    let allowedHimToAccessMyPrivatePublication: Int?
    let allowedHimToAccessMyShop: Int?
    let allowedShop: Int?
    let inFollowing: Int?
    
    var id: String?
    var friendID: String?

    //Local Value
    var name: String?
    var isShop: Bool = false
    var image: String?
    
    enum CodingKeys: String, CodingKey {
        case isBlocked
        case groups = "groups"
        case ownerID = "ownerId"
        case ownerType
        case friendID = "friendId"
        case friendType
        case createdAt, employeeRemarks, id, friend
        case remark, note
        case inFollowing, allowedShop, allowedPrivatePublication,
             allowedHimToAccessMyShop, allowedHimToAccessMyPrivatePublication
    }
    
    override func primaryKey() -> String {
        return "id"
    }
    
    override func ignoredKeys() -> [String] {
        ["isBlocked", "ownerID", "ownerType", "friendType", "createdAt", "employeeRemarks", "friend", "forwardSelected", "isSelected", "groups", "allowedPrivatePublication", "allowedShop", "inFollowing", "allowedHimToAccessMyPrivatePublication", "allowedHimToAccessMyShop"]
    }
    
    override func setValue(_ value: Any?, forUndefinedKey key: String) {
        
    }
    
    override func setNilValueForKey(_ key: String) {
        
    }
    
    static func getContactsList(ids: [String]) -> [BQContactInfoModel] {
        var tempList: [BQContactInfoModel] = []
        for id in ids {
            if let contact = BQContactInfoModel.rows(filter: "friendID='\(id)'").first {
                tempList.append(contact)
            }
        }
        return tempList
    }
    
}