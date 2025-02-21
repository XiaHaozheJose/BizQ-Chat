func updateFirebaseConversationUnReadInfo(conversation: BQConversation?, receiveId: String?) {
        guard let id = conversation?.id, let receiveId = receiveId, let myId = BQAccountManeger.currentId else { return }
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
