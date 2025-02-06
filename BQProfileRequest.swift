//
//  BQGestionContactRequest.swift
//  BizQ
//
//  Created by Jose_iOS on 08/04/2020.
//  Copyright © 2020 Gaudi Properties Consulting SL. All rights reserved.
//

import Foundation
//MARK: - Get Mime Contacts
struct BQGetMyContacts: BQNetworkProtocol  {
    typealias T = BQContactInfoList
    var parameters: Parameters = [:]
    var headers: HTTPHeaders = NetworkManeger.header
    var type: HTTPMethod { .get }
    var url: String = "\(baseUrl)/contacts/"
    
    var responseType: [String : [String]] {
        ["populates": ["groups", "friend"]]
    }
}

///创建通讯录
struct BQCreateContactRequest: BQNetworkProtocol {
    typealias T = BQSuccessNullResponse
    var parameters: Parameters = [:]
    var headers: HTTPHeaders = NetworkManeger.header
    var type: HTTPMethod { .post }
    var url: String = "\(baseUrl)/contacts/"
}
//////更新通讯录
struct BQUpdateContactRequest: BQNetworkProtocol {
    typealias T = BQSuccessNullResponse
    var parameters: Parameters = [:]
    var headers: HTTPHeaders = NetworkManeger.header
    var type: HTTPMethod { .patch }
    var url: String = "\(baseUrl)/contacts/"
}

///删除通讯录
struct BQDeleteContactRequest: BQNetworkProtocol {
    typealias T = BQSuccessNullResponse
    var parameters: Parameters = [:]
    var headers: HTTPHeaders = NetworkManeger.header
    var type: HTTPMethod { .delete }
    var url: String = "\(baseUrl)/contacts/"
}

///获取分组
struct BQGetContactGroupsRequest: BQNetworkProtocol {
    typealias T = BQContactGroupsList
    var parameters: Parameters = [:]
    var headers: HTTPHeaders = NetworkManeger.header
    var type: HTTPMethod { .get }
    var url: String = "\(baseUrl)/contact-groups/"
}

///创建分组
struct BQCreateContactGroupsRequest: BQNetworkProtocol {
    typealias T = BQSuccessNullResponse
    var parameters: Parameters = [:]
    var headers: HTTPHeaders = NetworkManeger.header
    var type: HTTPMethod { .post }
    var url: String = "\(baseUrl)/contact-groups/"
}
///
//////创建分组
struct BQUpdateContactGroupsRequest: BQNetworkProtocol {
    typealias T = BQSuccessNullResponse
    var parameters: Parameters = [:]
    var headers: HTTPHeaders = NetworkManeger.header
    var type: HTTPMethod { .patch }
    var url: String = "\(baseUrl)/contact-groups/"
}

///删除分组
struct BQDeleteContactGroupsRequest: BQNetworkProtocol {
    typealias T = BQSuccessNullResponse
    var parameters: Parameters = [:]
    var headers: HTTPHeaders = NetworkManeger.header
    var type: HTTPMethod { .delete }
    var url: String = "\(baseUrl)/contact-groups/"
}

//MARK: - Switch User Mime Info
struct BQUserInfoRequest: BQNetworkProtocol  {
    typealias T = BQMeUserInfoModel
    var parameters: Parameters = [:]
    var headers: HTTPHeaders = NetworkManeger.header
    var type: HTTPMethod { .get }
    var url: String = "\(baseUrl)/me/"
    var showErrorInfo: Bool { false }
}

//MARK: - Switch Business Mime Info
struct BQBusinessInfoRequest: BQNetworkProtocol  {
    typealias T = BQMeShopInfoModel
    var parameters: Parameters = [:]
    var headers: HTTPHeaders = NetworkManeger.header
    var type: HTTPMethod { .get }
    var url: String = "\(baseUrl)/me/"
    var showErrorInfo: Bool { false }
}

struct BQSwitchUserRequest: BQNetworkProtocol {
    typealias T = BQSuccessNullResponse
    var parameters: Parameters = [:]
    var headers: HTTPHeaders = NetworkManeger.header
    var type: HTTPMethod { .post }
    var url: String = "\(baseUrl)/switch-operator/"
}

struct BQSignInRequest: BQNetworkProtocol {
    typealias T = BQSignInUserModel
    var parameters: Parameters = [:]
    var type: HTTPMethod { .post }
    var url: String = "\(baseUrl)/operators-login/"
    var showErrorInfo: Bool { false }
}

//
//  BQSignInUserModel.swift
//  BizQ
//
//  Created by Jose_iOS on 06/03/2020.
//  Copyright © 2020 Gaudi Properties Consulting SL. All rights reserved.

// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let bQSignInUserModel = try? newJSONDecoder().decode(BQSignInUserModel.self, from: jsonData)

import Foundation

// MARK: - BQSignInUserModel
struct BQSignInUserModel: Codable {
    
    let token: String?
    
    enum CodingKeys: String, CodingKey {
        case token
    }
}

//MARK: - 普通用户
struct BQMeUserInfoModel: Codable {
    let `operator`: BQMeUserOperator?
    
    enum CodingKeys: String, CodingKey {
        case `operator`
    }
}

struct BQMeUserOperator: Codable {
    let payload: BQMeUserPayload?
    let id: String?
    let type: String?
    
    enum CodingKeys: String, CodingKey {
        case id, type, payload
    }
}

struct BQMeUserPayload: Codable {
    let data: BQUserInfoModel?
    enum CodingKeys: String, CodingKey {
        case data
    }
    
}

//MARK: 普通商家
struct BQMeShopInfoModel: Codable {
    let `operator`: BQMeShopOperator?
    
    enum CodingKeys: String, CodingKey {
        case `operator`
    }
}

struct BQMeShopOperator: Codable {
    let payload: BQMeShopPayload?
    let id: String?
    let type: String?
    
    enum CodingKeys: String, CodingKey {
        case id, type, payload
    }
}

struct BQMeShopPayload: Codable {
    let data: BQBusinessModel?
    enum CodingKeys: String, CodingKey {
        case data
    }
}

class BQBaseUserInfoModel: Codable {
}

class BQBaseSocialModel: Codable {
    let apple: BQUserEmailModel?
    let facebook: BQUserEmailModel?
    let google: BQUserEmailModel?
}

class BQUserInfoModel: Hashable, Codable, Parse {
    static func == (lhs: BQUserInfoModel, rhs: BQUserInfoModel) -> Bool {
        return (lhs.id ?? "").elementsEqual(rhs.id ?? "")
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
        hasher.combine(name)
    }
    
    var id: String?
    var publicStatus: BQAccessType?
    let outId: String?
    var areaCode: String?
    var phone: String?
    let password: String?
    let headImg: String?
    var name: String?
    let factoryId: String?
    let outIdChanged: Bool?
    var remark: String?
    var countryId: String?
    var provinceId: String?
    let mood: String?
    let `description`: String?
    let factory: BQFactoryInfoModel?
    let isDeleted: Bool?
    let payload: BQPayloadModel?
    var country: BQAreasModel?
    var province: BQAreasModel?
    let language: String?
    let operatorType: BQUserType?
    let allowSocial: Bool?
    //new
    var shops: [BQBusinessModel]?
    var myshops: [BQBusinessModel]?
    var inContact: Bool {
        set {
            findInContact = newValue ? 1 : 0
        }
        get {findInContact != nil && findInContact! > 0}
    }
    var isFollowed: Bool {
        set {
            inFollowing = newValue ? 1 : 0
        }
        get { inFollowing != nil && inFollowing! > 0 }
    }
    var allowedPrivatePub: Bool {
        set {
            allowedPrivatePublication = newValue ? 1 : 0
        }
        get {allowedPrivatePublication != nil && allowedPrivatePublication! > 0}
    }
    var allowedPrivateShop: Bool {
        set {
            allowedShop = newValue ? 1 : 0
        }
        get { allowedShop != nil && allowedShop! > 0 || publicStatus == .public }
    }
    var findInContact: Int?
    var allowedPrivatePublication: Int?
    var allowedShop: Int?
    var inFollowing: Int?
    var groups: [BQContactGroupModel]?
    var requestStatus: [BQRequestStatus]?
    let lastFourFriendPictures: [String]?
    var followedCatIds: [String]?
    
    //某些情况需要知道的用户类型
    //只有店铺才拥有这些类型
    var type: BQBusinessType?
    var logo: String?
    var zipcode: String? = nil
    var city: String?
    var street: String?
    let subCategory: String?
    var industries: [String]?
    var industriesDetail: [BQIndustryContentModel]?
    
    //验证信息
    var emailVerified: Bool?
    var email: String?
    var passwordCreated: Bool?
    var social: BQBaseSocialModel?
    var apple: BQUserEmailModel? { social?.apple }
    var google: BQUserEmailModel? { social?.google }
    var facebook: BQUserEmailModel? { social?.facebook }
    
    //目前只有店铺拥有type属性
    var isShop: Bool {
        if operatorType == .shop { return true }
        switch type {
        case .Retailer, .Manufacturer, .Wholesaler, .shop: return true
        default: return false
        }
    }
    var image: String? {
        logo ?? headImg
    }
    //临时数据
    var note: String?
    var isSelected: Bool = false
    var isApplied: Bool = false
    
    var emails: [BQUserEmailModel] {
        var list: [BQUserEmailModel] = []
        if var apple = apple, apple.email != nil {
            apple.fromType = .apple
            list.append(apple)
            if isVerified(apple.email!) { apple.isVerified = true }
        }
        
        if var google = google,
           google.email != nil,
           !list.contains(google) {
            google.fromType = .google
            list.append(google)
            if isVerified(google.email!) { google.isVerified = true }
        }
        
        if var facebook = facebook,
           facebook.email != nil, !list.contains(facebook) {
            facebook.fromType = .fb
            list.append(facebook)
            if isVerified(facebook.email!) { facebook.isVerified = true }
        }
        return list
    }
    
    lazy var subTitle: String? = {
        let indus = industriesDetail?.compactMap({ $0.currentName })
        return indus?.joined(separator: ", ")
    }()
    
    private func isVerified(_ userEmail: String) -> Bool {
        guard emailVerified == true else { return false }
        return userEmail.elementsEqual(email ?? "")
    }
    
    enum CodingKeys: String, CodingKey {
        case outId, areaCode, phone, headImg, logo, name, factoryId, outIdChanged
        , remark, countryId, provinceId, mood, factory, id, shops, isDeleted,
        type, payload, findInContact, `description`, password, lastFourFriendPictures, language,
        // 店铺属性
        zipcode, city, street, subCategory, industries, country, province,
        allowedPrivatePublication, allowedShop, inFollowing, groups, publicStatus,requestStatus, operatorType,
        passwordCreated, emailVerified, social, email, followedCatIds, myshops, industriesDetail, allowSocial
    }
    
    required init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        outId = try? container.decode(String.self, forKey: .outId)
        areaCode = try? container.decode(String.self, forKey: .areaCode)
        phone = try? container.decode(String.self, forKey: .phone)
        headImg = try? container.decode(String.self, forKey: .headImg)
        logo = try? container.decode(String.self, forKey: .logo)
        name = try? container.decode(String.self, forKey: .name)
        factoryId = try? container.decode(String.self, forKey: .factoryId)
        outIdChanged = try? container.decode(Bool.self, forKey: .outIdChanged)
        remark = try? container.decode(String.self, forKey: .remark)
        countryId = try? container.decode(String.self, forKey: .countryId)
        provinceId = try? container.decode(String.self, forKey: .provinceId)
        mood = try? container.decode(String.self, forKey: .mood)
        factory = try? container.decode(BQFactoryInfoModel.self, forKey: .factory)
        id = try? container.decode(String.self, forKey: .id)
        shops = try? container.decode([BQBusinessModel].self, forKey: .shops)
        isDeleted = try? container.decode(Bool.self, forKey: .isDeleted)
        type = try? container.decode(BQBusinessType.self, forKey: .type)
        payload = try? container.decode(BQPayloadModel.self, forKey: .payload)
        findInContact = try? container.decode(Int.self, forKey: .findInContact)
        `description` = try? container.decode(String.self, forKey: .`description`)
        password = try? container.decode(String.self, forKey: .password)
        lastFourFriendPictures = try? container.decode([String].self, forKey: .lastFourFriendPictures)
        language = try? container.decode(String.self, forKey: .language)
        if let zip = try? container.decode(Int.self, forKey: .zipcode) {
            zipcode = "\(zip)"
        }else { zipcode = try? container.decode(String.self, forKey: .zipcode) }
        city = try? container.decode(String.self, forKey: .city)
        street = try? container.decode(String.self, forKey: .street)
        subCategory = try? container.decode(String.self, forKey: .subCategory)
        industries = try? container.decode([String].self, forKey: .industries)
        country = try? container.decode(BQAreasModel.self, forKey: .country)
        province = try? container.decode(BQAreasModel.self, forKey: .province)
        allowedPrivatePublication = try? container.decode(Int.self, forKey: .allowedPrivatePublication)
        allowedShop = try? container.decode(Int.self, forKey: .allowedShop)
        inFollowing = try? container.decode(Int.self, forKey: .inFollowing)
        groups = try? container.decode([BQContactGroupModel].self, forKey: .groups)
        publicStatus = try? container.decode(BQAccessType.self, forKey: .publicStatus)
        requestStatus = try? container.decode([BQRequestStatus].self, forKey: .requestStatus)
        operatorType = try? container.decode(BQUserType.self, forKey: .operatorType)
        passwordCreated = try? container.decode(Bool.self, forKey: .passwordCreated)
        emailVerified = try? container.decode(Bool.self, forKey: .emailVerified)
        social = try? container.decode(BQBaseSocialModel.self, forKey: .social)
        email = try? container.decode(String.self, forKey: .email)
//        facebook = try? container.decode(BQUserEmailModel.self, forKey: .facebook)
        followedCatIds = try? container.decode([String].self, forKey: .followedCatIds)
        myshops = try? container.decode([BQBusinessModel].self, forKey: .myshops)
        industriesDetail = try? container.decode([BQIndustryContentModel].self, forKey: .industriesDetail)
        allowSocial = try? container.decode(Bool.self, forKey: .allowSocial)
    }
    
    
    
}

enum BQUserEmailType: String, Codable {
    case apple, fb, google, other
    
    
}

struct BQUserEmailModel: Codable, Equatable {
    let uniqId: String?
    let email: String?
    let areaCode: String?
    let phone: String?
    var fromType: BQUserEmailType?
    
    var isVerified: Bool = false
    
    static func == (lhs: BQUserEmailModel, rhs: BQUserEmailModel) -> Bool {
        return lhs.email == rhs.email
    }
    
    enum CodingKeys: String, CodingKey {
        case uniqId, email, areaCode, phone
    }
}

struct BQPayloadModel: Codable {
    let lastLoginTimeStamp: Double?
    let areaCode: String?
    let phone: String?
    enum CodingKeys: String, CodingKey {
        case lastLoginTimeStamp, areaCode, phone
    }
}

struct BQFactoryInfoModel: Codable {
    let shopIds: [String]?
    let id: String?
    let ownerId: String?
    
    enum CodingKeys: String, CodingKey {
        case shopIds, ownerId, id
    }
}

struct BQUserInfoList: Codable {
    let users: [BQUserInfoModel]?
    enum CodingKeys: String, CodingKey {
        case users
    }
}

typealias BQImageInfoList = [BQImageInfoModel]
struct BQImageInfoModel: Codable {
    let `operator`: String?
    let fileName: String?
    
    enum CodingKeys: String, CodingKey {
        case `operator`, fileName
    }
}


