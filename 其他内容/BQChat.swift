//
//  BQChatViewModel-Observer.swift
//  BizQ
//
//  Created by Jose_iOS on 16/04/2020.
//  Copyright © 2020 Gaudi Properties Consulting SL. All rights reserved.
//

import Foundation

extension String {
     static func generateConversationId(id1: String, id2: String) -> String? {
        let sortedIds = [id1, id2].sorted()
        let concatenatedIds = sortedIds.joined()
        return generateMD5(concatenatedIds)
    }

    static func generateMD5(_ input: String) -> String? {
        guard let data = input.data(using: .utf8) else { return nil }
        var digest = [UInt8](repeating: 0, count: Int(CC_MD5_DIGEST_LENGTH))
        data.withUnsafeBytes { bytes in
            _ = CC_MD5(bytes.baseAddress, CC_LONG(data.count), &digest)
        }
        return digest.map { String(format: "%02x", $0) }.joined().padding(toLength: 32, withPad: "0", startingAt: 0)
    }
}

extension BQChatViewModel {
    
    /*
     "5e5seds45d -> ID":
     {
     "conversation": { "conversationId": "", "unReadCount": 10}
     "user": {"avatar": "", "name": ", "isShop": "" }
     }*/
    //MARK: Firebase
    ///进入聊天室 监听对方 id 下的 会话记录
    func beginObserveReceiveUserStatus(conversationId: String) {
        guard let receiveId = BQChatViewModel.shared.receiveUser?.id,
              let myId = BQAccountManeger.currentId else { return }
        let handle = ref.child(field_message_user_table) // BQConversationUser
            .child(receiveId)
            .child(FirebaseConstants.field_observe_conversation)// observeConversations
            .child(myId)
            .child(field_message_conversation_table)
            .child(field_unRead_count)
            .observe(.value, with: { (snapshot) in
                
                if snapshot.exists(), let unReadCount = snapshot.value as? Int {
                    //如果获取到对方unReadCount 变为0 了。。则更新本地未读为 已读
                    if unReadCount == 0 {
                        print("进来监听====状态了")
                        BQChatViewModel.shared.updateAllLocalMessage(with: conversationId, for: BQMessageStatusType.isRead.rawValue)
                    }}})
        BQChatViewModel.shared.observerStatusHandle = (conversationId, handle)
    }
    
    //清空当前聊天状态监听
    func removeCurrentObserveStatus() {
        guard let receiveId = BQChatViewModel.shared.receiveUser?.id,
              let myId = BQAccountManeger.currentId else { return }
        guard let statusHandle = observerStatusHandle else { return }
        
        ref.child(field_message_user_table)
            .child(receiveId)
            .child(FirebaseConstants.field_observe_conversation)
            .child(myId)
            .child(field_message_conversation_table)
            .child(field_unRead_count).removeObserver(withHandle: statusHandle.handle)
        BQChatViewModel.shared.observerStatusHandle = nil
    }
    
    //监听当前会话 需要判断是否已经退出聊天窗口
    func observeCurrentConversation(conversationId: String) {
        let handle = ref.child(field_message_conversation_table)
            .child(conversationId)
            .child(field_message_message_table)
            .observe(.childAdded) { [weak self] (snapshot) in
                if BQMessageViewModel.shared.isLoadConversation { return }
                if snapshot.exists(), let obj = snapshot.value as? [String: Any] {
                    //判断是否是我自己收到
                    if let senderId = obj[field_sender] as? String,
                       !senderId.elementsEqual(BQAccountManeger.currentId ?? "###") {
                        print("进来!!!!会话监听了", conversationId)
                        //判断是否还在聊天框
                        if conversationId.elementsEqual(
                            BQChatViewModel.shared.localConversationModel?.id ?? "") {
                            //更新消息, 不通知
                            BQChatViewModel.shared.createNewMessage(messageObj: obj)
                        }else {
                            self?.updateHasNewMessage(conversationId: conversationId, senderId: senderId, obj: obj )
                        }
                    }
                }
            }
        BQChatViewModel.shared.observerConversationHandle = (conversationId, handle)
    }
    
    ///删除当前会话监听器
    func removeCurrentConversationObserverHandle() {
        guard let currentId = localConversationModel?.id ?? currentConversationID else { return }
        guard let observerHandle = observerConversationHandle else { return }
        ref.child(field_message_conversation_table)
            .child(currentId)
            .child(field_message_message_table).removeObserver(withHandle: observerHandle.handle)
        BQChatViewModel.shared.observerConversationHandle = nil
    }
    
}

//MARK: Local DB
extension BQChatViewModel {
    
    func updateAllLocalMessage(with conversationId: String, for status: String) {
        DispatchQueue.main.async {
            let list = BQConversationMessage.loadNotReadMessages(conversationId: conversationId)
            if list.count == 0 { return }
            BQConversationMessage.updateMessageToIsRead(msgList: list)
            //如果当前的conversationId == 监听的Id则 刷新页面
            if conversationId.elementsEqual(BQChatViewModel.shared.localConversationModel?.id ?? "") {
                BQChatViewModel.shared.reloadLocalMessageList(limit: 501)
            }
        }
    }
    
    private func updateAllRemoteMessage(with conversationId: String, for status: String) {
        // 获取该会话下的所有消息
        let messagesPath = "BQConversationMessage/\(conversationId)"
        ref.child(messagesPath).observeSingleEvent(of: .value) {[weak self] snapshot in
            guard let messages = snapshot.value as? [String: Any] else {
                print("No messages found for this conversation.")
                return
            }
            
            // 创建批量更新字典
            var updates: [String: Any] = [:]
            for (messageId, _) in messages {
                // 构造更新路径
                let statusPath = "\(messagesPath)/\(messageId)/status"
                updates[statusPath] = status
            }
            
            // 执行批量更新
            self?.ref.updateChildValues(updates) { error, _ in
                if let error = error {
                    print("Error updating messages: \(error.localizedDescription)")
                } else {
                    print("All messages updated successfully!")
                }
            }
        }
    }
    
    private func updateHasNewMessage(conversationId: String, senderId: String, obj: [String: Any]) {
        //修改本地数据 未读数量
        if let oldConversation = BQConversation.hasConversation(id: conversationId) {
            oldConversation.unReadCount += 1
            oldConversation.save()
        }
        //获取用户信息 发送本地通知
        ref.child(field_message_user_table)
            .child(senderId)
            .child(FirebaseConstants.field_observe_conversation)
            .child(BQAccountManeger.currentId ?? "null")
            .observeSingleEvent(of: .value) { (snapshot) in
                if let value = snapshot.value as? [String: Any], let user = value[field_message_user_table] as? [String: Any] {
                    let userInfo = (user[field_title] as? String ?? "", user[field_avatar] as? String ?? "", user[field_isShop] as? Bool == true)
                    self.createNewMessage(messageObj: obj, userInfo: userInfo)
                }
            }
    }
    
}


//
//  BQChatViewModel.swift
//  BizQ
//
//  Created by Jose_iOS on 10/04/2020.
//  Copyright © 2020 Gaudi Properties Consulting SL. All rights reserved.
//

import Foundation
import Firebase

/// 消息VIew Model
class BQChatViewModel: Parse {
    //MARK: - Shared Instance
    static let shared = BQChatViewModel()
    private init() {}
    
    //MARK: - Chat Common Vars.
    var ref: DatabaseReference { BQDBServer.shared.fireDBRef }
    var isGrouped: Bool = false
    //会话监听列表
    var observerConversationHandle: (conversationId: String, handle: UInt)?
    //状态监听列表
    var observerStatusHandle: (conversationId: String, handle: UInt)?
    // 会话设置完成回调
    private var conversationSetupComplete: (() -> Void)?
    //Message menu status
    var referenceMessage: BQConversationMessage?
    
    ///gestion conversation
    fileprivate var conversationReceiveUser: BQConversationUser? {
        didSet {
            if conversationReceiveUser == nil { return }
            if let conversation = conversationReceiveUser?.loadConversation() {
                localConversationModel = conversation
                if localConversationModel != nil {
                    reloadLocalMessageList(limit: 501)
                }
            }
        }
    }
    ///加载message
    fileprivate (set) var localConversationModel: BQConversation?
    //当前Conversation Id
    fileprivate (set) var currentConversationID: String? {
        didSet { NotificationCenter.default.post(name: .observeChatNotification,
                                                 object: nil) }
    }
    ///接收者 对外开放
    var receiveUser: BQConversationUser? {
        didSet {
            guard let receive = receiveUser,
                  let id = receive.id else { return }
            
            clearOldData()
            isGrouped = receive.isGrouped
            receive.save()
            
            // 设置连接
            BQDBServer.shared.updateUserConnection(to: id)
            conversationReceiveUser = receive
            
            // 状态设置完成后调用回调
            conversationSetupComplete?()
            conversationSetupComplete = nil
        }
    }
    
    ///发送者ID
    fileprivate var senderId: String? {
        BQAccountManeger.currentId
    }
    
    //MARK: - Chat Message Cell Vars.
    var previousAudioCell: BQChatBaseAudioMessageCell?
    
    //MARK: - Functions
    private func clearOldData() {
        localConversationModel = nil
        currentConversationID = nil
        conversationReceiveUser = nil
    }
    
    //MARK: Gestion Firebase
    ///进入Chat 页面开始 只有进入页面才会进此处
    func startConversation(isDiffusion: Bool = false,
                           conversation: BQConversation? = nil, completion: CompletionWithNullResponse? = nil) {
        //如果是群发
        if isDiffusion {
            localConversationModel = conversation
            reloadLocalMessageList(limit: 501)
        } else {
            checkConversationToFirebase { (_) in
                completion?(true)
            } }
    }
    //正常聊天
    func checkConversationToFirebase(receiveName: String? = nil,
                                     receiveAvatar: String? = nil,
                                     receiveId: String? = nil,
                                     receiveIsShop: Bool? = nil,
                                     forwardMessage: BQConversationMessage? = nil,
                                     forSystemMessage: Bool = false,
                                     conversation: (isDiffusion: Bool, conversation: BQConversation?)? = nil,
                                     completion: CompletionWithResponse<String>? = nil) {
        
        guard let senderId = BQAccountManeger.currentId else { return }
        guard let receiveId = receiveId ?? receiveUser?.id else { return }
        let conversationId = (conversation == nil) || (conversation?.isDiffusion == true) ? nil : localConversationModel?.id
        
        //获取用户信息
        let name: String = receiveName ?? receiveUser?.name ?? "UnKonw"
        let avatar: String = receiveAvatar ?? receiveUser?.avatar ?? "###"
        let isShop: Bool = receiveIsShop ?? receiveUser?.isShop ?? false
        let userIds = [senderId, receiveId].joined(separator: field_separator)
        
        //本地有conversation
        if conversationId != nil {
            createNewConversation(conversationId: conversationId!, senderId: senderId, receiveId: receiveId, userIds: userIds, avatar: avatar, isShop: isShop, name: name, forwardMessage: forwardMessage, forSystemMessage: forSystemMessage)
        } else {
            //本地没有的情况
            ref.child(field_message_user_table)
                .child(senderId)
                .child(FirebaseConstants.field_observe_conversation)
                .child(receiveId)
                .child(field_message_conversation_table)
                .child(field_conversationId)
                .observeSingleEvent(of: .value) { [weak self] (snapshot) in
                    if snapshot.exists(),
                       let firConversationId = snapshot.value as? String {
                        //如果fire有值
                        self?.ref.child(field_message_conversation_table)
                            .child(firConversationId)
                            .observeSingleEvent(of: .value) { (conSnap) in
                                if conSnap.exists() {
                                    //服务器存在 本地不存在 但是存在ID
                                    self?.createNewConversation(conversationId: firConversationId, senderId: senderId, receiveId: receiveId, userIds: userIds, newFirebaseCon: false , newLocalCon: true , avatar: avatar, isShop: isShop, name: name, forwardMessage: forwardMessage, forSystemMessage: forSystemMessage)
                                    //                                completion?(firConversationId)
                                }else {
                                    //服务器上不存在 本地也不存在 但是存在ID
                                    self?.createNewConversation(conversationId: firConversationId, senderId: senderId, receiveId: receiveId, userIds: userIds, newFirebaseCon: true, newLocalCon: true, avatar: avatar, isShop: isShop, name: name, forwardMessage: forwardMessage, forSystemMessage: forSystemMessage)
                                }
                                completion?(firConversationId)
                            }
                    }else {
                        //服务器上不存在 则本地也没有 为全新
                        guard let guid = String.generateConversationId(id1: receiveId, id2: senderId) else { return }
                        self?.createNewConversation(conversationId: guid, senderId: senderId, receiveId: receiveId, userIds: userIds, newFirebaseCon: true, newLocalCon: true, avatar: avatar, isShop: isShop, name: name, forwardMessage: forwardMessage, forSystemMessage: forSystemMessage)
                        completion?(guid)
                    }
                }
        }
    }
    
    
    //MARK: Create conversation | 创建会话窗口
    /// Create new conversation on firebase , 创建新的会话 在firebase 上
    /// - Parameters:
    ///   - conversationId: 会话 ID
    ///   - senderId: 发送者 ID
    ///   - receiveId: 接收者 ID
    ///   - newFirebaseCon: 是否需要创建 远端 会话
    ///   - newLocalCon: 是否需要创建 本地 会话
    ///   - avatar: 接收者头像
    ///   - isShop: 接收者是否是 店铺
    ///   - name: 接收者名称
    ///   - forwardMessage: 转发消息  [为空 --- 正常消息] [不为空 --- 转发消息]
    func createNewConversation(conversationId: String,
                               senderId: String,
                               receiveId: String,
                               userIds: String,
                               newFirebaseCon: Bool = false,
                               newLocalCon: Bool = false,
                               avatar: String,
                               isShop: Bool,
                               name: String,
                               forwardMessage: BQConversationMessage? = nil,
                               forSystemMessage: Bool,
                               completion: CompletionWithNullResponse? = nil) {
        //此处【接收者】, 在接收方收那边为【发送者】,
        if newFirebaseCon { // 是否需要创建新的
            let conversation: [String: Any] = ["\(field_isGrouped)": isGrouped
                                               ,field_receive: receiveId, 
                                               field_sender: senderId,
                                               field_users: userIds,
                                               field_creator: senderId
            ]
            ref.child(field_message_conversation_table).child(conversationId).setValue(conversation)
        } else {
            ref.child(field_message_conversation_table).child(conversationId).child(field_isGrouped).setValue(isGrouped)
        }
        
        if newLocalCon {
            if BQConversation.hasConversation(id: conversationId) == nil {
                createConversationForLocalDB(with: conversationId, receiveId: receiveId, senderId: senderId, userIds: userIds, isForward: forwardMessage != nil)
            }
        }
        
        // 如果转发为空
        if forwardMessage == nil && !forSystemMessage {
            //获取当前conversationId 发送更新通知
            self.currentConversationID = conversationId
        } else {
            //如果是转发 或者 静默消息 则更新用户信息
            if let user = BQConversationUser.loadUser(receiveId) {
                user.name = name
                user.avatar = avatar
                user.isShop = isShop
                user.save()
            } else {
                let user = BQConversationUser(id: receiveId, title: name, avatar: avatar, isShop: isShop)
                user.save()
            }
        }
        
        //创建或者更新 新会话
        self.createNewUser(senderId: senderId, receiveId: receiveId, conversationId: conversationId, avatar: avatar, isShop: isShop, name: name, completion: { [weak self] in
            // 如果转发消息不为空 则转发消息
            if let message = forwardMessage {
                //构建新的 消息
                let toForwardMessage = BQConversationMessage(id: UUID().uuidString, conversationId: conversationId, content: message.content, msgType: message.type, status: BQMessageStatusType.sending.rawValue, timestamp: Date.timestamp, senderId: senderId, filePath: message.filePath ?? "", recordTime: message.recorderTime ?? 0)
                // 发送消息
                if (self?.localConversationModel?.id ?? "").elementsEqual(conversationId) {
                    self?.insertNewMessage(toForwardMessage)
                }
                self?.sendMessage(info: (content: message.content ?? "", type: BQMessageType(rawValue: message.type ?? "text")!), toForwardMessage, receiveId: receiveId, senderId: senderId, conversationId: conversationId, isShop: isShop)
            }
        })
        
    }
    
    //MARK: 创建群发会话 Diffusion
    func createDiffusionConversation(conversation: BQConversation? = nil, senderId: String, receives: [BQContactInfoModel]) -> (conversation: BQConversation, isSave: Bool) {
        let receiveId = receives.compactMap{$0.friend?.id}.joined(separator: "_")
        let timestamp = Date.timestamp
        if let oldConversation = conversation {
            //如果已存在当前conversation
            oldConversation.receiveId = receiveId
            oldConversation.timestamp = timestamp
            return (oldConversation, oldConversation.save())
        } else {
            //新创建
            let id = UUID().uuidString
            let conversation = BQConversation(id: id, receiveId: receiveId, userIds: nil, isGrouped: false, timestamp: timestamp, isDiffusion: true)
            return (conversation, conversation.save())
        }
    }
    
    
    //MARK: 创建远端 接收者用户
    //创建firebase user
    /// 创建 远端 用户
    /// - Parameters:
    ///   - senderId: 发送者
    ///   - receiveId: 接收者
    ///   - conversationId: 会话
    ///   - avatar: 接收者 头像
    ///   - isShop: 接收者是否是店铺
    ///   - name: 接收者名称
    ///   - completion: 完成创建回调
    private func createNewUser(senderId: String, senderName: String? = nil, senderAvatar: String? = nil, senderIsShop: Bool? = nil, receiveId: String, conversationId: String, avatar: String, isShop: Bool, name: String, completion: (()->())? = nil) {
        
        var count = 0
        let receiveName = name
        let receiveAvatar = avatar
        let receiveIsShop = isShop
        
        let senderUser: [String: Any] = [field_title: senderName ?? BQAccountManeger.currentName, field_avatar:senderAvatar ?? BQAccountManeger.currentAvatar, field_isShop: senderIsShop ?? BQAccountManeger.isShop, field_isGrouped: false]
        
        let receiveUser: [String: Any] = [field_title: receiveName, field_avatar: receiveAvatar, field_isShop: receiveIsShop, field_isGrouped: isGrouped]
        
        //更新双方 ConversationId
        ref.child(field_message_user_table)
            .child(senderId)
            .child(FirebaseConstants.field_observe_conversation)
            .child(receiveId)
            .child(field_message_conversation_table)
            .child(field_conversationId)
            .setValue(conversationId)
        
        ref.child(field_message_user_table)
            .child(receiveId)
            .child(FirebaseConstants.field_observe_conversation)
            .child(senderId)
            .child(field_message_conversation_table)
            .child(field_conversationId)
            .setValue(conversationId)
        
        //更新双方用户信息
        //在我的id下创建接收者
        self.ref.child(field_message_user_table).child(senderId).child("\(FirebaseConstants.field_observe_conversation)").child(receiveId).child(field_message_user_table).setValue(receiveUser) { (_, _) in
            count += 1
            if count >= 2 { completion?() }
        }
        //在接收者id下创建发送者
        self.ref.child(field_message_user_table).child(receiveId).child("\(FirebaseConstants.field_observe_conversation)").child(senderId).child(field_message_user_table).setValue(senderUser, withCompletionBlock: { (_, _) in
            count += 1
            if count >= 2 { completion?() }
        })
        
    }
    
    func createGroupUsers(contacts: [BQContactInfoModel]) {
        guard let conversationId = currentConversationID ?? localConversationModel?.id else { return }
        guard let groupId = receiveUser?.id else { return }
        let receiveName = receiveUser?.name ?? "###"
        let receiveAvatar = receiveUser?.avatar ?? ""
        for contact in contacts {
            guard let id = contact.friend?.id else { continue }
            let name = contact.friend?.name ?? "###"
            let avatar = contact.friend?.image ?? ""
            let isShop = contact.friend?.isShop == true
            createNewUser(senderId: id, senderName: name, senderAvatar: avatar, senderIsShop: isShop, receiveId: groupId, conversationId: conversationId, avatar: receiveAvatar, isShop: false, name: receiveName, completion: nil)
        }
    }
    
    //MARK: 更新 远端 消息状态
    ///更新firebase 消息状态
    /// - Parameters:
    ///   - conversationId:会话
    ///   - messageId: 消息 ID
    ///   - status: 需要改成的状态
    private func updateFirebaseMessageStatus(conversationId: String?, messageId: String, status: BQMessageStatusType) {
        //更新状态
        ref.child(field_message_conversation_table).child(conversationId ?? "###").child(field_message_message_table).child(messageId).child(field_message_status).setValue(status.rawValue)
    }
    
    //MARK: 清楚旧数据
    ///清除数据
    func removeObserveRef() {
        //1. 清除当前 监听
        removeCurrentObserveStatus()
        removeCurrentConversationObserverHandle()
        //2. 清除旧数据
        localConversationModel = nil
        conversationReceiveUser = nil
        receiveUser = nil
        referenceMessage = nil
        //3. 更新firebase 聊天对象状态
        BQDBServer.shared.updateUserConnection(to: "null")
    }
    
    //MARK: Gestion Local Database
    /// 更新数据 从 firebase获取 对外开放
    /// - Parameters:
    ///   - messageObj: 消息对象
    ///   - userInfo: 用户信息
    func createNewMessage(messageObj: [String: Any],
                          userInfo: (name: String,
                                     avatar: String,
                                     isShop: Bool)? = nil) {
        let content = messageObj[field_content] as? String
        
        //如果userInfo 不为空则展示收到通知消息
        if userInfo != nil {
            showLocalNotificationInfo(name: userInfo?.name, content: content,
                                      avatar: userInfo?.avatar, isShop: userInfo?.isShop == true)
        }
        createMessageForLocalDB(messageObj: messageObj, canRemove: true)
    }
    
    //MARK: 创建新的conversation到本地
    ///创建新的conversation到本地
    /// - Parameters:
    ///   - id: 会话ID
    ///   - receiveId: 接收者ID
    ///   - senderId: 发送者ID
    ///   - isForward: 是否是转发
    private func createConversationForLocalDB(with id: String,
                                              receiveId: String,
                                              senderId: String,
                                              userIds: String,
                                              isForward: Bool = false) {
        let conversationModel = BQConversation(id: id, receiveId: receiveId, userIds: userIds, isGrouped: self.isGrouped, timestamp: Date.timestamp)
        conversationModel.insertConversation()
        if !isForward { localConversationModel = conversationModel }
        
    }
    
    //MARK: 创建本地消息 从Firebase 监听收到
    ///创建新的Message到本地
    /// - Parameters:
    ///   - messageObj: 消息对象
    ///   - canRemove: 是否删除远端 历史
    private func createMessageForLocalDB(messageObj: [String: Any], canRemove: Bool) {
        guard let messageId = messageObj[field_id] as? String,
              let conversationId = messageObj[field_conversationId] as? String else { return }
        let rTimestamp = messageObj[field_real_timestamp] as? Int
        guard let lastMessage = parseJsonToObject(json: messageObj, BQConversationMessage.self) else { return }
        lastMessage.loadSenderUser()
        lastMessage.status = BQMessageStatusType.received.rawValue
        lastMessage.timestamp = rTimestamp != nil ? "\(rTimestamp!)" : lastMessage.timestamp
        self.insertNewMessage(lastMessage)
        // 如果可删除 则删除远程数据
        if (canRemove) {
            //暂时不做删除动作
//            self.ref.child(field_message_conversation_table).child(conversationId).child(field_message_message_table).child(messageId).setValue(nil)
        }else {
            //更新状态
            self.ref.child(field_message_conversation_table).child(conversationId).child(field_message_message_table).child(messageId).child(field_message_status).setValue(BQMessageStatusType.received.rawValue)
        }
    }
    
    //MARK: 插入消息
    ///插入新消息,并刷新
    /// - Parameters:
    ///   - message: 消息对象
    ///   - needUpdate: 是否更新当前列表
    func insertNewMessage(_ message: BQConversationMessage?,
                          conversation: BQConversation? = nil,
                          needUpdate: Bool = true,
                          addToLastMessage: Bool = true) {
        guard let message = message else { return }
        //更新 message
        let hasMessage = BQConversationMessage.loadHasMessage(id: message.id ?? "")
        message.save()
        if addToLastMessage {
            if let conversation = conversation {
                updateConversationTime(conversation, timestamp: message.timestamp)
                addMessageToLast(conversation, message: message)
            } else {
                updateConversationTime(localConversationModel, timestamp: message.timestamp)
                //是否添加到 lastMessage
                if !hasMessage, (currentConversationID ?? "").elementsEqual(message.conversationId ?? ""){
                    addMessageToLast(localConversationModel, message: message)
                }
            }
        }
        //更新
        if needUpdate {
            notificationUpdateNotification()
        }
    }
    
    //MARK: 插入到最后一条
    /// 将消息插入到最后一条消息
    /// - Parameters:
    ///   - conversation: conversation
    ///   - message: message
    private func addMessageToLast(_ conversation: BQConversation?, message: BQConversationMessage) {
        conversation?.messages.append(message)
        conversation?.lastMessage = message
    }
    
    //更新时间戳
    private func updateConversationTime(_ conversation: BQConversation?, timestamp: String?) {
        //更新conversation 时间
        conversation?.timestamp = timestamp
        conversation?.save()
    }
    
    //MARK: 删除本地消息 Delete Local Message
    /// 删除本地消息 Delete Local Message
    /// - Parameter :
    ///   - message:  需要删除的 消息 Objecto Message
    ///   - needNotify:  是否需要通知更新 If need notify to update
    func deleteMessage(_ message: BQConversationMessage, needNotify: Bool = true) {
        guard let _ = message.id else { return }
        switch BQMessageType(rawValue: message.type ?? "") {
        case .audio:
            guard let receiveId = receiveUser?.id else { break }
            BQFileManegerUtils.getAudioFile(id: receiveId, withName: message.filePath ?? "", andURL: message.content ?? "", onlyPath: true) { (file) in
                if let path = file {
                    BQFileManegerUtils.deleteFile(with: URL(fileURLWithPath: path))
                }
            }
        case .pdf:
            guard let receiveId = receiveUser?.id else { break }
            BQFileManegerUtils.getSanboxFile(id: receiveId, fileName: message.filePath ?? "", urlPath: message.content ?? "", extensionPath: message.type ?? "", onlyPath: true) { (filePath) in
                if let path = filePath {
                    BQFileManegerUtils.deleteFile(with: path)
                }
            }
        default: break
        }
        if message.delete(), needNotify {
            NotificationCenter.default.post(name: .updateChatConversationNotification, object: nil)
        }
    }
    
    //MARK: 删除双方消息
    func deleteMessageForAll(_ message: BQConversationMessage, completion: (()->())? ) {
        //        guard let senderId = senderId else { return }
        guard let conversationId = message.conversationId else { return }
        guard let receiveId = receiveUser?.id else { return }
        guard let messageId = message.id else { return }
        
        //1.0 删除远端 会话里的 消息
        ref.child(field_message_conversation_table)
            .child(conversationId)
            .child(field_message_message_table)
            .child(messageId)
            .setValue(nil)
        
        //2.0获取对方 需删除 列表
        ref.child(field_message_user_table)
            .child(receiveId)
            .child(FirebaseConstants.field_delete_message)
            .observeSingleEvent(of: .value) { [weak self] (snapshot) in
                // 有值 需删除 列表
                var objList: [String: Any] = [:]
                if var oldList = snapshot.value as? [String: Any] {
                    //讲新的需要删除的 加载到已有列表里 has delete list
                    oldList[messageId] = conversationId
                    objList = oldList
                    //没有 需删除 列表 No has delete list
                }else {
                    objList[messageId] = conversationId
                }
                // 将得到的 新删除列表 赋值给 远端 Update En Firebase
                self?.updateFirebaseDeleteMessageInfo(obj: objList, receiveId: receiveId)
                //删除本地 delete local
                self?.deleteMessage(message, needNotify: false)
                //完成回调 completion
                completion?()
            }
    }
    
    //MARK: 更新远端 删除列表数据
    private func updateFirebaseDeleteMessageInfo(obj: [String: Any], receiveId: String) {
        ref.child(field_message_user_table)
            .child(receiveId)
            .child(FirebaseConstants.field_delete_message).setValue(obj)
    }
    
    //MARK: 更新 本地 消息状态
    ///修改消息状态, 并且更新
    ///  - Parameters:
    ///   - status: 状态
    ///   - message: 消息对象
    private func updateMessageStatus(status: String, message: BQConversationMessage) {
        print("更新消息通知为=",status)
        message.status = status
        if message.save() {
            notificationUpdateNotification()
        }
    }
    
    ///修改图片 或者 语音的服务器路径
    private func updateMessageFilePath() {
        
    }
    
    //MARK: 更新通知
    ///通知刷新
    private func notificationUpdateNotification() {
        print("通知更新")
        NotificationCenter.default.post(name: .updateMessageNotification, object: nil)
    }
    
    //MARK: 展示本地通知窗口 通知
    ///展示本地通知
    func showLocalNotificationInfo(name: String?, content: String?, avatar: String?, isShop: Bool) {
        let notifyInfo = (avatar, name, content?.localizedStr, isShop: isShop)
        BQNotifyAnimationView.showNotify(info: notifyInfo)
    }
    
    //MARK: 重写加载本地消息列表
    ///加载本地信息数据
    func reloadLocalMessageList(limit: Int){
        guard let conversationModel = localConversationModel else { return }
        conversationModel.loadMessageList(limit: limit)
        notificationUpdateNotification()
    }
    
    //MARK: - Gestion Chat
    //MARK: 发送群消息 Send Diffusion Message
    func sendMessageWithDiffusionContacts(_ contacts: [BQContactInfoModel],
                                          conversation: BQConversation?,
                                          withInfo info: (content: String, type: BQMessageType),
                                          withOldMessage oldMessage: BQConversationMessage? = nil,
                                          filePath: String? = nil,
                                          completion: CompletionWithNullResponse?) {
        guard let sendId = BQAccountManeger.currentId else { return }
        guard let diffusionId = conversation?.id else { return }
        var diffusionMessage = BQConversationMessage(id: UUID().uuidString, conversationId: diffusionId, content: info.content, msgType: info.type.rawValue, status: BQMessageStatusType.hasSent.rawValue, timestamp: Date.timestamp, senderId: sendId, filePath: filePath ?? oldMessage?.filePath, recordTime: oldMessage?.recorderTime)
        if let old = oldMessage { diffusionMessage = old }
        //逐个获取 通讯录
        for contact in contacts {
            let id = contact.friendID
            let name = contact.name ?? contact.friend?.name
            let image = contact.image ?? contact.friend?.image
            let isShop = contact.isShop
            //首先更新本地用户信息, 可异步
            DispatchQueue.main.async {
                let contact = BQConversationUser(id: id, title: name, avatar: image, isShop: isShop)
                contact.save()
            }
            //查看本地数据库 是否存在会话ID
            checkConversationToFirebase(receiveName: name, receiveAvatar: image, receiveId: id, receiveIsShop: isShop, conversation: (isDiffusion: true, conversation: nil)) { [weak self] (conversationId) in
                if info.type == .audio {
                    self?.sendMessage(info: info, diffusionMessage, receiveId: id, senderId: sendId, conversationId: conversationId, filePath: filePath, isShop: isShop, isDiffusion: true)
                } else {
                    self?.sendMessage(info: info, diffusionMessage, receiveId: id, senderId: sendId, conversationId: conversationId, filePath: filePath, isShop: isShop, isDiffusion: true)
                }
            }
        }
        diffusionMessage.status = BQMessageStatusType.hasSent.rawValue
        insertNewMessage(diffusionMessage, conversation: conversation, needUpdate: true)
        completion?(true)
    }
    
    //MARK: Send Normal Message
    ///\~chinese
    ///发送消息带上消息类型
    ///\~english
    /// Send message with message type Example: >>> text , image , audio...
    /// - Parameters:
    ///   - info: message Info
    func sendMessage(info: (content: String, type: BQMessageType),
                     _ oldMessage: BQConversationMessage? = nil,
                     receiveId: String? = nil,
                     senderId: String? = nil,
                     conversationId: String? = nil,
                     filePath: String? = nil,
                     isShop: Bool,
                     isDiffusion: Bool = false,
                     completion: CompletionWithNullResponse? = nil) {
        guard let tempConversationId = conversationId ?? localConversationModel?.id else { return }
        guard let tempReceiveId = receiveId ?? receiveUser?.id else { return }
        guard let tempSenderId = senderId ?? self.senderId else { return }
        
        var message: BQConversationMessage!
        var timestamp = Date.timestamp
        var messageId = UUID().uuidString
        
        //0.如果是 图片 和 音频需要先加载本地的。。再次进来更新
        if let model = oldMessage {
            message = model
            message.content = info.content
            message.filePath = filePath
            timestamp = model.timestamp ?? timestamp
            messageId = isDiffusion
            ? messageId
            : (model.id ?? messageId)
            //如果是群发, 并且是有老消息对象情况, 还需要为每个
            if isDiffusion {
                message.id = messageId
                message.conversationId = conversationId
                message.status = BQMessageStatusType.hasSent.rawValue
                checkHasReferenceMessage(message: message)
                insertNewMessage(message, needUpdate: conversationId == nil, addToLastMessage: false)
            }
        } else {
            //其他情况将是 重新创建message
            message = BQConversationMessage(id: messageId, conversationId: tempConversationId, content: info.content, msgType: info.type.rawValue, status: BQMessageStatusType.sending.rawValue, timestamp: timestamp, senderId: tempSenderId, filePath: filePath, recordTime: nil)
            
            //cn ~ 首先本地先展示 发送的消息, en ~ show message first
            checkHasReferenceMessage(message: message)
            insertNewMessage(message, needUpdate: conversationId == nil )
        }
        
        // 判断是否有网络
        if Reachability.currentConnection == .unavailable {
            updateMessageStatus(status: BQMessageStatusType.unSend.rawValue, message: message)
        }
        
        bqPrint("判断是否跟我聊天")
        //2.判断是否在跟我聊天
        self.verificationConnection(conversationId: tempConversationId,
                                    receiveId: tempReceiveId) { [weak self](isConnected) in
            
            if isConnected { // 2.1正在我的会话框
                bqPrint("正在跟我聊天")
                message.status = BQMessageStatusType.isRead.rawValue
                //2.1.1 保存为已读到 firebase
                bqPrint("发送到firebase")
                self?.createFirebaseMessage(message: message, messageId: messageId, conversationId: tempConversationId, completion: { (isSuccess) in
                    //2.1.2未发送成功
                    if !isSuccess{
                        bqPrint("发送firebase失败")
                        self?.updateMessageStatus(status: BQMessageStatusType.unSend.rawValue,
                                                  message: message); return
                    }
                    //2.1.3发送成功
                    bqPrint("发送firebase 成功")
                    self?.updateMessageStatus(status: BQMessageStatusType.isRead.rawValue, message: message)
                    completion?(true)
                })
            }else { // 2.2不在我的会话框
                bqPrint("不在跟我聊天")
                //将状态改为-已发送
                message.status = BQMessageStatusType.hasSent.rawValue
                bqPrint("发送到firebase")
                self?.createFirebaseMessage(message: message, messageId: messageId, conversationId: tempConversationId, completion: { (isSuccess) in
                    //说明是转发 则通知
                    if conversationId != nil {
                        NotificationCenter.default.post(name: .forwardMessageNotification, object: nil)
                    }
                    // 2.2.1 未发送成功 - 同上
                    if !isSuccess {
                        bqPrint("发送firebase失败 不在跟我聊天")
                        self?.updateMessageStatus(status: BQMessageStatusType.unSend.rawValue,
                                                  message: message); return }
                    // 2.2.2 发送firebase 成功则更新数据
                    self?.updateMessageStatus(status: BQMessageStatusType.received.rawValue, message: message)
                    
                    // 2.2.3 发送成功 -> 通知 -> 增加未读
                    bqPrint("发送到通知")
                    self?.notificateMessage(message: message, senderId: tempSenderId, receiveId: tempReceiveId, isShop: isShop, completion: { (canNotify) in
                        //通知成功
                        if canNotify {
                            bqPrint("发送通知成功 或者不需要发送")
                        }
                    })
                    //2.2.4 firebase 上传成功 则更新对方未读
                    self?.ref.child(field_message_user_table)
                        .child(tempReceiveId)
                        .child(FirebaseConstants.field_observe_conversation)
                        .child(tempSenderId)
                        .child(field_message_conversation_table)
                        .observeSingleEvent(of: .value, with: { (snapShot) in
                            var newValue: [String: Any] = [field_unRead_count: 1, field_conversationId: tempConversationId]
                            bqPrint("更新对方未读")
                            //是否已有未读数量
                            if snapShot.exists() {
                                if var value = snapShot.value as? [String: Any], let unReadCount = value[field_unRead_count] as? Int {
                                    //已存在未读 继续添加
                                    let newCount = unReadCount + 1
                                    value[field_unRead_count] = newCount
                                    newValue = value
                                }  }
                            //更新未读数量
                            self?.ref.child(field_message_user_table).child(tempReceiveId).child(FirebaseConstants.field_observe_conversation)
                                .child(tempSenderId)
                                .child(field_message_conversation_table)
                                .setValue(newValue)
                        })
                    completion?(true) })  }}
    }
    
    //MARK: 创建远端 消息 对象
    ///上传到firebase 接口 ｜ upload to firebase
    private func createFirebaseMessage(message: BQConversationMessage, messageId: String, conversationId: String, completion: @escaping (Bool)->()) {
        var msgObj = parseObjToJson(obj: message) as? Parameters
        msgObj?[field_real_timestamp] = FirebaseDatabase.ServerValue.timestamp()
        ref.child(field_message_conversation_table).child(conversationId).child(field_message_message_table).child(messageId).setValue(msgObj) { (error, _) in
            completion(error == nil)
        }
    }
    
    //MARK: 判断用户是否在线 , 是否正在跟我聊天
    ///\~chinese
    ///判断用户是否在线 并且是否在跟我聊天
    ///\~english
    /// verification the connection was me
    /// - Parameters:
    ///   - conversationId: conversation Id , 会话Id
    ///   - receiveId: receive
    ///   - completion: callback
    private func verificationConnection(conversationId: String, receiveId: String, completion: @escaping((_: Bool)->())) {
        //Verification the connection
        ref.child(field_message_user_table)
            .child(receiveId)
            .child(FirebaseConstants.field_current_connection)
            .observeSingleEvent(of: .value, with: {(snapshot) in
                // if the connection was me / 判断是否在跟我聊天
                if snapshot.exists(), let id = snapshot.value as? String {
                    //is true 正在跟我聊
                    if id.elementsEqual(BQAccountManeger.currentId ?? "") {
                        completion(true)
                    }else { //is false 不在跟我聊,发送通知
                        completion(false)
                    } } else { // 还没有开始聊, 发送通知
                        completion(false)
                    }
            })
    }
    
    //MARK: 发送 远程通知 Notification Remote 当用户不在聊天窗口或者不在线的情况
    ///\~chinese
    ///如果对方不在聊天但是在线情况, 发送通知
    ///\~english
    /// If not connect with me
    /// - Parameters:
    ///   - conversationId: conversation Id
    ///   - info: message Info
    private func notificateMessage(message: BQConversationMessage,
                                   senderId: String,
                                   receiveId: String,
                                   isShop: Bool,
                                   completion: @escaping CompletionWithNullResponse) {
        ref.child(senderId)
            .child(FirebaseConstants.field_observe_conversation)
            .child(receiveId)
            .child(field_message_conversation_table)
            .child(field_isSpam).observeSingleEvent(of: .value) { (snapshot) in
                let isSpam = snapshot.value as? Bool
                if isSpam == false || isSpam == nil {
                    self.execSendNotificationPush(message: message, senderId: senderId, receiveId: receiveId, isShop: isShop, completion: completion)
                } else {
                    completion(true)
                }
            }
        
    }
    
    private func execSendNotificationPush(message: BQConversationMessage,
                                          senderId: String,
                                          receiveId: String,
                                          isShop: Bool,
                                          completion: @escaping (Bool)->()) {
        //必须手动写, 因为通知只支持 String
        let messageObj: [String: Any?] = [
            field_id: message.id,
            field_conversationId: message.conversationId,
            field_content: message.content,
            field_msgType: message.type,
            field_filePath: message.filePath ?? "",
            field_recorder_time: "\(message.recorderTime ?? 0)",
            field_sender: senderId,
            field_receive: receiveId,
            field_isShop: BQAccountManeger.isShop ? "true" : "false",
            field_isGrouped: isGrouped ? "true" : "false",
            field_avatar: BQAccountManeger.isShop ? BQAccountManeger.currentBusiness?.logo ?? "" : BQAccountManeger.currentUser?.headImg ?? "",
            field_title: BQAccountManeger.currentName
        ]
        
        //初始化通知请求
        var notificationRequest = BQMessageNotificationRequest()
        var param: [String: Any] =
        [
            "toId": receiveId,
            "toType": isShop ? "shop" : "user"
        ]
        let body = getBodyContentWithMessageType(message: message)
        let notify = [
            "title": "\(BQAccountManeger.currentName) \("发送给".localizedStr) \(self.receiveUser?.name ?? "")",
            "body": body,
            "badge": "0",
            "sound": "default"
        ]
        param["notification"] = notify
        param["data"] = messageObj
        notificationRequest.parameters = param
        //开始请求
        notificationRequest.request { (result) in
            switch result {
            case .success(_):  completion(true)
            case .failled(_): completion(false)
            } }
    }
    
    //MARK: 返回远程通知 消息体
    ///根据类型返回消息体
    private func getBodyContentWithMessageType(message: BQConversationMessage) -> String {
        let type = BQMessageType(rawValue: message.type ?? "text") ?? .text
        var content = message.content ?? ""
        switch type {
        case .audio: content = bqAudioNotify.localizedStr
        case .image: content = bqImageNotify.localizedStr
        case .location: content = bqImageNotify.localizedStr
        case .order: content = bqOrderNotify.localizedStr
        case .contact: content = bqContactNotify.localizedStr
        case .product: content = bqProductNotify.localizedStr
        case .payment: content = bqPaymentNotify.localizedStr
        case .preOrder: content = bqReservationNotify.localizedStr
        case .pdf: content = bqFileNotify.localizedStr
        case .initializePayment: content = bqInitializePaymentNotify.localizedStr
        case .shipment: content = bqShipmentNotify.localizedStr
        case .return: content = bqReturnNotify.localizedStr
        case .outOfStock: content = bqOutOfStockNotify.localizedStr
        case .coupon: content = bqCouponNotify.localizedStr
        case .voucher: content = bqVoucherNotify.localizedStr
        case .system: content = bqSystemNotify.localizedStr
        default: break
        }
        return content
    }
    
    //MARK: 是否有引用消息
    private func checkHasReferenceMessage(message: BQConversationMessage) {
        if let referenceMessage = referenceMessage,
           let messageType = referenceMessage.type,
           let type = BQMessageType(rawValue: messageType) {
            message.referenceMessageContent = type.content.localizedStr
            switch type {
            case .order, .preOrder:
                message.referenceMessageContent = referenceMessage.orderModel?.orderNumber
            case .return, .shipment, .outOfStock:
                if let shipmentModel = parseStringJsonToObj(strJson: referenceMessage.content ?? "", BQChatShipmentMessageModel.self) {
                    message.referenceMessageContent = shipmentModel.number
                }
            case .coupon,.voucher:
                if let bondModel =  parseStringJsonToObj(strJson: referenceMessage.content ?? "", BondsDetailModel.self) {
                    message.referenceMessageContent = bondModel.number
                }
            default:
                message.referenceMessageContent = type.content.localizedStr
            }
            message.referenceMessageId = referenceMessage.id
            message.referenceMessageSender = referenceMessage.sender?.name ?? BQAccountManeger.currentName
            message.referenceMessageType = referenceMessage.type
            message.referenceMessageSenderId = referenceMessage.senderId
        }
    }
    
}

//MARK: - Message Specific
extension BQChatViewModel {
    
    //MARK: 发送语音
    /// 发送语音, 先加载本地的 - 再上传服务器 - 再发送给好友
    /// - Parameter info: data - audio bytes,  filePath - path of audio file
    func sendAudioMessage(diffusionConversation: BQConversation? = nil ,
                          info: (data: Data, filePath: String, time: Double),
                          completion: CompletionWithResponse<BQConversationMessage>? = nil) {
        let id = diffusionConversation?.id ?? currentConversationID
        let message = BQConversationMessage(id: UUID().uuidString, conversationId: id, content: nil, msgType: BQMessageType.audio.rawValue, status: BQMessageStatusType.sending.rawValue, timestamp: Date.timestamp, senderId: senderId, filePath: info.filePath , recordTime: info.time)
        let isShop = receiveUser?.isShop == true
        //当不是群发时 才提前存本地
        if (diffusionConversation == nil) {
            checkHasReferenceMessage(message: message)
            insertNewMessage(message)
        }
        let request = BQUploadSingleFileRequest()
        request.multiformRequest(files: [BQMultiFormFileInfo(part: "file", name: "audio", data: info.data, mimeExtension: .aac)]) { [weak self] (result) in
            var hasError: Bool = false
            switch result {
            case .success(let file):
                guard let urlPath = file.uri else { hasError = true; return }
                if diffusionConversation != nil {
                    message.content = urlPath
                    completion?(message)
                } else {
                    self?.sendMessage(info: (urlPath, BQMessageType.audio), message, isShop: isShop)
                }
            case .failled(_):
                hasError = true
            }
            ///上传有错误
            if hasError {
                self?.updateMessageStatus(status: BQMessageStatusType.unSend.rawValue, message: message)
            }
        }
    }
    
}

//MARK: 开放外部 跳转聊天框接口
extension BQChatViewModel {
    /// 跳转聊天框
    func showConversation(contactInfo: (id: String,
                                      logo: String?,
                                      name: String?,
                                      isShop: Bool),
                         from vc: UIViewController? = nil,
                         completion: (() -> Void)? = nil) {
        let conversationUser = BQConversationUser(id: contactInfo.id,
                                                title: contactInfo.name,
                                                avatar: contactInfo.logo,
                                                isShop: contactInfo.isShop,
                                                isGrouped: false)
        
        // 设置完成回调
        conversationSetupComplete = {
            guard let from = vc ?? Router.shared.getCurrentViewController() else { return }
            DispatchQueue.main.async {
                Router.shared.pushViewController(from: from,
                                              to: BQChatViewController.self,
                                              naviItemTitle: contactInfo.name ?? "Chat".localizedStr)
                completion?()
            }
        }
        
        // 设置 receiveUser 会触发上面的回调
        self.receiveUser = conversationUser
    }
}

//MARK: 其他静默消息 发送
extension BQChatViewModel {
    func sendSilentNotifyMessage(_ users: [BQSilentNotifyUserInfo],
                                 conversation: String?,
                                 withInfo info: (content: String, type: BQMessageType),
                                 filePath: String? = nil,
                                 completion: CompletionWithNullResponse?) {
        guard let sendId = BQAccountManeger.currentId else { return }
        //逐个获取 通讯录
        var count: Int = 0
        for user in users {
            let id = user.id
            let name = user.name
            let image = user.image
            let isShop = user.isShop
            if id.elementsEqual(receiveUser?.id ?? "") {
                //说明是从聊天框进来的[少数, 待测试]
                sendMessage(info: info, isShop: isShop)
                count += 1
            } else {
                //查看本地数据库 是否存在会话ID
                if let cId = conversation {
                    self.sendMessage(info: info, receiveId: id, senderId: sendId, conversationId: cId, filePath: filePath, isShop: isShop)
                    count += 1
                } else {
                    checkConversationToFirebase(receiveName: name, receiveAvatar: image, receiveId: id, receiveIsShop: isShop, forSystemMessage: true) { [weak self] (conversationId) in
                        self?.sendMessage(info: info, receiveId: id, senderId: sendId, conversationId: conversationId, filePath: filePath, isShop: isShop)
                        count += 1
                        if count == users.count {
                            completion?(true); return
                        }
                    }
                }
            }
            if count == users.count {
                completion?(true); return
            }
        }
    }
    
}

//MARK: - BQSilentNotifyUserInfo
struct BQSilentNotifyUserInfo {
    let name: String
    let language: LanguageCodes
    let id: String
    let image: String
    let isShop: Bool
    
    init(id: String,
         name: String,
         image: String,
         isShop: Bool,
         areaCode: String
    ) {
        self.id = id
        self.name = name
        self.image = image
        self.isShop = isShop
        self.language = BQLocalizedServer.default.getLanguage(withAreaCode: areaCode) ?? .en
    }
    
}

//
//  BQChatMoreActionDataSource.swift
//  BizQ
//
//  Created by Jose_iOS on 18/04/2020.
//  Copyright © 2020 Gaudi Properties Consulting SL. All rights reserved.
//

import UIKit

protocol BQChatActionDataSource {}

extension BQChatActionDataSource {
    var actionCellHeight: CGFloat { 70 }
    var bottomInputActionViewHeight: CGFloat { 56 }
    var referenceViewHeight: CGFloat { 50 }
    var baseActionViewHeight: CGFloat { screen_height * 0.3 }
}

enum BQChatMessageMenuType: String {
    case resend = "重新发送"
    case reply = "引用"
    case forward = "转发"
    case copy = "复制"
    case undo = "撤回"
    case delete = "删除"
    case download = "Download"
}