
class BQMessageViewModel: Parse {
    static let shared = BQMessageViewModel()
    private init() {}
    
    // 5. 确保观察者正确移除
    deinit {
        removeObserverRef()
    }
    
    var isLoadConversation: Bool = false
    var observeConversationHandle: UInt?
    var observeDeleteMessageHandle: UInt?
    
    lazy var ref:  DatabaseReference = {
        let database = Database.database().reference(fromURL: fireDBURL)
        return database
    } ()
    
    // 1. 添加节流控制
    private var lastUpdateTimestamp: TimeInterval = 0
    private let minimumUpdateInterval: TimeInterval = 0.5
    
    // 2. 添加分页加载
    private var pageSize: Int = 20
    private var lastLoadedKey: String?
    
    //MARK: - 获取本地会话 列表
    ///获取本地会话 对话
    func loadLocalConversationList(completion:
                                   @escaping CompletionWithResponse<BQConversationContentInfo>) {
        DispatchQueue.main.async {
            let content = self.getConversations(list: BQConversationModelList.loadConversationList())
            completion(content)
        }
    }
    
    //分别获取 陌生人 和 普通聊天
    private func getConversations(list: [BQConversation]) -> (spam: [BQConversation], contact: [BQConversation]) {
        // 过滤并排序非垃圾消息
        let contact = list.filter { $0.isSpam == false }
            .sorted {
                guard
                    let timestamp1 = $0.lastMessage?.timestamp,
                    let timestamp2 = $1.lastMessage?.timestamp,
                    let time1 = Int64(timestamp1),
                    let time2 = Int64(timestamp2)
                else {
                    return $0.lastMessage?.timestamp != nil // 如果有timestamp，将其排前
                }
                return time1 > time2 // 时间大的排在前面
            }

        // 过滤并排序垃圾消息
        let spam = list.filter { $0.isSpam == true }
            .sorted {
                guard
                    let timestamp1 = $0.lastMessage?.timestamp,
                    let timestamp2 = $1.lastMessage?.timestamp,
                    let time1 = Int64(timestamp1),
                    let time2 = Int64(timestamp2)
                else {
                    return $0.lastMessage?.timestamp != nil // 如果有timestamp，将其排前
                }
                return time1 > time2 // 时间大的排在前面
            }

        return (spam, contact)
    }
    
    //MARK: - 删除回话
    func deleteConversation(conversation: BQConversation) {
        DispatchQueue.main.async {
            conversation.deleteConversationMessage()
        }
    }
    
    //MARK: 从firebase 更新会话列表
    ///获取firebase会话 监听自己的 会话信息
    func loadFirebaseConversationList(withUserId queryUserId: String?) {
        guard let userId = queryUserId else { return }
        isLoadConversation = true
        DispatchQueue.global(qos: .userInitiated).async {
            self.ref.child(field_message_user_table)
                .child(userId)
                .child(FirebaseConstants.field_observe_conversation)
                .observeSingleEvent(of: .value) { [weak self] (snapShot) in
                    /*
                     "5e5seds45d -> 对方ID":
                     {
                     "conversation": { "conversationId": "", "unReadCount": 10}
                     "user": {"avatar": "", "name": ", "isShop": "" }
                     }
                     */
                    DispatchQueue.main.async {
                        if snapShot.exists(), let info = snapShot.value as? [String: Any] {
                            
                            var count: Int = 0
                            for (key, value) in info {
                                if let subObj = value as? [String: Any],
                                   let conversationObj = subObj[field_message_conversation_table] as? [String: Any],
                                   let conversationId = conversationObj[field_conversationId] as? String,
                                   let user = subObj[field_message_user_table] as? [String: Any] {
                                    
                                    let unReadCount = conversationObj[field_unRead_count] as? Int
                                    //对方用户信息
                                    let avatar = user[field_avatar] as? String
                                    let name = user[field_title] as? String
                                    let isShop = user[field_isShop] as? Bool
                                    
                                    self?.checkFirebaseInfo(conversationId: conversationId, unReadCount: unReadCount ?? 0, user: (id: key, avatar: avatar, name: name, isShop: isShop), completion: { _ in
                                        count += 1
                                        if count >= info.count {
                                            NotificationCenter.default.post(name: .updateMessageNotification, object: nil)
                                        }
                                    })
                                }
                            }
                        }else {
                            self?.isLoadConversation = false }
                    }
                }
        }
    }
    
    //MARK: 比较firebase
    ///对比firebase 的数据
#warning("如果通知关掉, 内部通知也不适用")
    private func checkFirebaseInfo(conversationId: String, unReadCount: Int, user: (id: String, avatar: String?, name: String?, isShop: Bool?), completion: @escaping CompletionWithNullResponse) {
        DispatchQueue.global(qos: .userInitiated).async {
            self.ref.child(field_message_conversation_table)
                .child(conversationId)
                .observeSingleEvent(of: .value) { [weak self] (snapshot: DataSnapshot) in
                    DispatchQueue.main.async {
                        //存在并且有消息
                        if snapshot.exists(),
                           let value = snapshot.value as? [String: Any],
                           let message = value[field_message_message_table] as? [String: Any] {
                            /*
                             message {"id": {"xx": "xx"}, "id": {"xx": "xx"}}
                             */
                            let isGroup = value[field_isGrouped] as? Bool
                            let userIds = value[field_users] as? String
                            //临时数据
                            var tempMsgs: [BQConversationMessage] = []
                            var tempSenderId: String?
                            
                            for (key, value) in message {
                                if let messageObj = value as? [String: Any] {
                                    tempSenderId = messageObj[field_sender] as? String
                                    let realTimestamp = messageObj[field_real_timestamp] as? Int
                                    //判断如果是自己发送的 则循环下一个
                                    if (tempSenderId ?? "").elementsEqual(BQAccountManeger.currentId ?? "") {
                                        if !BQConversationMessage.loadHasMessage(id: key) {
                                            //如果自己没有保存, 则保存 [一般存在于删除了 app 对方消息未读的时候]
                                            if let messageModel = self?.parseJsonToObject(json: messageObj, BQConversationMessage.self) {
                                                messageModel.timestamp = realTimestamp != nil ? "\(realTimestamp!)" : messageModel.timestamp
                                                messageModel.save()
                                            }
                                        }
                                        continue
                                    }
                                    
                                    //本地是否保存, 没有则写入
                                    if !BQConversationMessage.loadHasMessage(id: key) {
                                        if let messageModel =
                                            self?.parseJsonToObject(json: messageObj, BQConversationMessage.self) {
                                            messageModel.timestamp = realTimestamp != nil ? "\(realTimestamp!)" : messageModel.timestamp
                                            tempMsgs.append(messageModel)
                                            //设为已收到 firebase 数据, functions 自动删除
                                            self?.ref
                                                .child(field_message_conversation_table)
                                                .child(conversationId)
                                                .child(field_message_message_table)
                                                .child(key).child(field_message_status).setValue(BQMessageStatusType.received.rawValue)
                                        }
                                    }
                                    
                                    // 处于已读的信息
                                    //                            if let status = messageObj[field_message_status] as? String,
                                    //                               (status.elementsEqual(BQMessageStatusType.isRead.rawValue)) {
                                    //暂时不做任何删除相关的事情
                                    //                                self?.ref
                                    //                                    .child(field_message_conversation_table)
                                    //                                    .child(conversationId)
                                    //                                    .child(field_message_message_table)
                                    //                                    .child(key)
                                    //                                    .setValue(nil)
                                    //                            }
                                }
                            }
                            
                            // 时间排序
                            if tempMsgs.count > 1 {
                                tempMsgs.sort { return TimeInterval($0.timestamp ?? "0")! < TimeInterval($1.timestamp ?? "0")!}
                            }
                            
                            // 创建本地接收用户信息
                            self?.checkConversationUser(senderId: user.id, title: user.name, avatar: user.avatar, isShop: user.isShop)
                            
                            // 更新或者 创建本地conversation
                            self?.checkConversation(conversationId: conversationId, isGroup: isGroup == true, receiveId: user.id, userIds: userIds, unReadCount: unReadCount, messageTimeStamp: tempMsgs.last?.timestamp)
                            
                            //插入消息
                            BQConversationMessage.insertMessages(list: tempMsgs)
                            //结束更新
                            self?.isLoadConversation = false
                            //结束之后刷新界面
                            completion(true)
                        } else {
                            completion(true)
                            self?.isLoadConversation = false
                        }
                    }
                }
            
        }
        
    }
    
    //MARK: 更新本地 会话
    //对比 本地是否存在 会话
    private func checkConversation(conversationId: String, isGroup: Bool, receiveId: String?, userIds: String?, unReadCount: Int, messageTimeStamp: String? = nil) {
        //是否有本地会话
        if let oldModel = BQConversation.hasConversation(id: conversationId) {
            if unReadCount > 0, oldModel.unReadCount != unReadCount {
                print("未读消息 == ",unReadCount)
                oldModel.unReadCount = unReadCount
                oldModel.timestamp = unReadCount > 0 ? messageTimeStamp ?? Date.timestamp : oldModel.timestamp
                oldModel.updateConversation() }
        }else {
            let conversation = BQConversation(id: conversationId, receiveId: receiveId, userIds: userIds, isGrouped: isGroup, timestamp: Date.timestamp)
            //check has conversation with this user
            if let oldConversation = conversation.receiveUser?.loadConversation(), !(oldConversation.id ?? "").elementsEqual(conversationId) {
                oldConversation.unReadCount = unReadCount
                oldConversation.updateConversationId(newId: conversationId)
            } else {
                conversation.unReadCount = unReadCount
                conversation.insertConversation()
            }
            print("新未读消息 == ",unReadCount)
        }
    }
    
    //MARK: 修改本地Conversation 是否屏蔽
    func updateConversationStatus(conversation: BQConversation, toSpam: Bool) {
        conversation.isSpam = toSpam
        conversation.save()
        updateFirebaseConversationStatus(conversation: conversation, toSpam: toSpam)
    }
    
    private func updateFirebaseConversationStatus(conversation: BQConversation, toSpam: Bool) {
        guard let currentId = BQAccountManeger.currentId else { return }
        guard let receiveId = conversation.receiveId else { return }
        ref.child(field_message_user_table)
            .child(currentId)
            .child(FirebaseConstants.field_observe_conversation)
            .child(receiveId)
            .child(field_message_conversation_table)
            .child(field_isSpam).setValue(toSpam)
    }
    
    
    //MARK: 会话更新或者 保存 到本地
    //对比本地是否存在对话 用户
    private func checkConversationUser(senderId: String?, title: String?, avatar: String?, isShop: Bool?) {
        guard let id = senderId else { return }
        //是否本地有此用户, 如果有则更新
        var conversationUser: BQConversationUser?
        if let oldConversationUser = BQConversationUser.loadUser(id) {
            oldConversationUser.avatar = avatar
            oldConversationUser.name = title
            oldConversationUser.isShop = isShop == true
            conversationUser = oldConversationUser
        } else {
            conversationUser = BQConversationUser(id: senderId, title: title, avatar: avatar, isShop: isShop == true)
        }
        conversationUser?.save()
    }
    
    //MARK: - 更新未读数量
    ///更新unReadCount 数量为0
    func updateFirebaseConversationUnReadInfo(conversation: BQConversation?, receiveId: String?) {
        guard let id = conversation?.id, let receiveId = receiveId, let myId = BQAccountManeger.currentId else { return }
        DispatchQueue.global(qos: .default).async {
            self.ref.child(field_message_user_table)
                .child(myId)
                .child(FirebaseConstants.field_observe_conversation)
                .child(receiveId)
                .child(field_message_conversation_table)
                .observeSingleEvent(of: .value) { [weak self] (snapshot) in
                    DispatchQueue.main.async {
                        
                        let newValue: [String: Any] = [field_conversationId: id, field_unRead_count: 0]
                        
                        if let value = snapshot.value as? [String: Any],
                           let unReadCount = value[field_unRead_count] as? Int,
                           unReadCount > 0 {
                            self?.ref.child(field_message_user_table).child(myId).child(FirebaseConstants.field_observe_conversation).child(receiveId).child(field_message_conversation_table).setValue(newValue)
                        }
                    }
                    BQConversation.updateConversationStatus(id: id, unReadCount: 0, timeStamp: conversation?.timestamp ?? Date.timestamp)
                    //结束之后刷新界面
                    //NotificationCenter.default.post(name: .updateMessageNotification, object: nil)
                }
        }
    }
}

//MARK: - 监听所有会更改的conversations
extension BQMessageViewModel {
    /// 监听所有会更改的conversations
    func observerConversationsListDidChanged() {
        guard let id = BQAccountManeger.currentId else { return }
        
        // 移除旧的观察者
        removeObserverRef()
        
        // 限制监听范围
        let query = ref.child(field_message_user_table)
            .child(id)
            .child(FirebaseConstants.field_observe_conversation)
            .queryLimited(toLast: UInt(pageSize))
        
        DispatchQueue.global(qos: .default).async {
            self.observeConversationHandle = query.observe(.childChanged) { [weak self] snapshot in
                DispatchQueue.main.async {
                    guard let self = self else { return }
                    
                    // 添加节流控制
                    let currentTime = Date().timeIntervalSince1970
                    guard currentTime - self.lastUpdateTimestamp >= self.minimumUpdateInterval else {
                        return
                    }
                    self.lastUpdateTimestamp = currentTime
                    
                    // 处理数据更新
                    self.handleConversationUpdate(snapshot)
                }
            }
        }
    }
    
    // 4. 优化数据处理
    private func handleConversationUpdate(_ snapshot: DataSnapshot) {
        guard let value = snapshot.value as? [String: Any],
              let conversation = value[field_message_conversation_table] as? [String: Any],
              let conversationId = conversation[field_conversationId] as? String,
              let unRead = conversation[field_unRead_count] as? Int,
              unRead > 0 else {
            return
        }
        
        // 批量更新而不是逐条处理
        DispatchQueue.main.async { [weak self] in
            self?.checkFirebaseInfo(
                conversationId: conversationId,
                unReadCount: unRead,
                user: (
                    id: snapshot.key,
                    avatar: (value[field_message_user_table] as? [String: Any])?[field_avatar] as? String,
                    name: (value[field_message_user_table] as? [String: Any])?[field_title] as? String,
                    isShop: (value[field_message_user_table] as? [String: Any])?[field_isShop] as? Bool
                ),
                completion: { _ in
                    NotificationCenter.default.post(name: .updateMessageNotification, object: nil)
                }
            )
        }
    }
    
    //MARK: 监听删除列表 Observe Delete Message From Firebase
    func observerDeleteMessage() {
        // Current User Id
        guard let currentId = BQAccountManeger.currentId else { return }
        //如果有旧的Handle 删除
        if let handle = observeDeleteMessageHandle {
            ref.child(field_message_user_table)
                .child(currentId)
                .child(FirebaseConstants.field_delete_message).removeObserver(withHandle: handle)
        }
        // Begin Observe 开始监听
        DispatchQueue.global(qos: .default).async {
            self.observeDeleteMessageHandle = self.ref.child(field_message_user_table)
                .child(currentId)
                .child(FirebaseConstants.field_delete_message)
                .observe(.value) { [weak self] (snapshot) in
                    guard let self = self else { return }
                    // If has value
                    DispatchQueue.main.async {
                        
                        if let value = snapshot.value as? [String: String] {
                            for obj in value {
                                let messageId = obj.key
                                let conversationId = obj.value
                                let deleted = BQConversationMessage.deleteMessageWithId(messageId)
                                //更新列表消息 if can deleted , update conversation
                                if deleted {
                                    self.checkObserverDeleteMessageWithConversation(id: conversationId, messageId: messageId)
                                }
                                //更新远端删除列表 update delete message list en firebase
                                self.updateFirebaseDeleteList(mineId: currentId, messageId: messageId)
                            }
                            //发送更新通知 update interfaz
                            NotificationCenter.default.post(name: .updateChatConversationNotification, object: nil)
                        } }
                }
        }
        
        
    }
    
    //MARK: 删除本地相关 消息 Delete Message En Local
    private func checkObserverDeleteMessageWithConversation(id: String, messageId: String) {
        let conversationModelList = BQConversationModelList.loadConversationList()
        // if conversation list > 0
        if conversationModelList.count > 0 {
            // Get a temp conversation object
            let tempConversation = BQConversation(id: id, receiveId: nil, userIds: nil, isGrouped: false, timestamp: nil)
            // Get message List by this temp conversation
            tempConversation.loadMessageList()
            // Give message list to current conversation where equal Id
            _ = conversationModelList.map( { if ($0.id ?? "").elementsEqual(id) { $0.messages = tempConversation.messages} })
            
            //如果正在跟此还有聊天
            // If has connect with you
            if (BQChatViewModel.shared.localConversationModel?.id ?? "").elementsEqual(id) {
                BQChatViewModel.shared.localConversationModel?.messages = tempConversation.messages
            }
            //判断是否有引用 if has reference message
            if (BQChatViewModel.shared.referenceMessage?.id ?? "").elementsEqual(messageId) {
                BQChatViewModel.shared.referenceMessage = nil
            }
        }
    }
    
    //MARK: 更新远端删除列表 Update Delete Message List En Firebase
    private func updateFirebaseDeleteList(mineId: String, messageId: String) {
        ref.child(field_message_user_table)
            .child(mineId)
            .child(FirebaseConstants.field_delete_message)
            .child(messageId).setValue(nil)
    }
    
    //MARK: - 删除所有 监听
    func removeObserverRef() {
        guard let id = BQAccountManeger.currentId else { return }
        
        ref.child(field_message_user_table)
            .child(id)
            .child(FirebaseConstants.field_delete_message)
            .removeAllObservers()
        
        ref.child(field_message_user_table)
            .child(id)
            .child(FirebaseConstants.field_observe_conversation)
            .removeAllObservers()
        
        observeConversationHandle = nil
        observeDeleteMessageHandle = nil
    }
}

import Foundation

enum BQMessageViewConversationType: String {
    case spam
    case contact
    
    var content: String {
        switch self {
        case .contact: return "联系人消息".localizedStr
        case .spam:    return "屏蔽的消息".localizedStr
        }
    }
}

typealias BQConversationContentInfo = (spam: [BQConversation], contact: [BQConversation])

class BQMessageViewContentModel {
    static var types: [BQMessageViewConversationType] = [.contact, .spam]
    let type: BQMessageViewConversationType
    var conversations: [BQConversation] = []
    var isShow: Bool
    
    init(type: BQMessageViewConversationType) {
        self.type = type
        isShow = type == .contact
    }
    
    static func getContentList() -> [BQMessageViewContentModel] {
        var tempList = [BQMessageViewContentModel]()
        for type in BQMessageViewContentModel.types {
            tempList.append(BQMessageViewContentModel(type: type))
        }
        return tempList
    }
    
}


