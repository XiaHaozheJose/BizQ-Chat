动态圈模块:
在sideNav上加一个动态圈功能, 然后动态圈展示页包含[附近动态圈, 公开圈, 关注圈]
根据当前user的类型, 如果operatorType == user 则shopType传入 [BusinessType.Retail], 如果是operatorType == business 则传入 [BusinessType.Wholesaler, BusinessType.Manufacturer], 注意通过limit, skip进行分页加载, 下拉滑动加载更多, 手动点击加载更多

1.  附近动态圈, 需要点击tab, 并且申请获取当前位置, 然后使用下面的接口
    http://dev.bizq.com/backend/api/v1/publications/?lat=40.416775&limit=10&skip=0&showInPlatform=true&onlyPublication=true&publicType=public&lon=-3.70379&shopType%5B%5D=Wholesaler&shopType%5B%5D=Manufacturer&sort%5B%5D=updatedAt_desc&sort%5B%5D=distance_asc

response: 根据types/publications.ts 的模型实例

2. 关注圈, 通过下面的接口
   http://dev.bizq.com/backend/api/v1/publications/?catIds%5B%5D=ES60002&followed=true&shopType%5B%5D=Wholesaler&shopType%5B%5D=Manufacturer&skip=0&limit=10&onlyPublication=true&publicType=public&following=true

3. 公开圈, 通过下面的接口
   http://dev.bizq.com/backend/api/v1/publications/?publicType=public&limit=10&onlyPublication=true&shopType%5B%5D=Wholesaler&shopType%5B%5D=Manufacturer&showInPlatform=true&catIds%5B%5D=ES60002&followed=true&skip=0
