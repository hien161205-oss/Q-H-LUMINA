import React from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';

const contentMap: Record<string, { title: string; body: string }> = {
  'story': {
    title: 'Câu chuyện thương hiệu',
    body: `Q&H LUMINA ra đời từ niềm đam mê với vẻ đẹp thuần khiết và sự trân trọng giá trị bền vững của thiên nhiên. Bắt nguồn từ một phòng nghiên cứu nhỏ tại thung lũng xanh mướt, chúng tôi đã dành nhiều năm để tìm kiếm những nguyên liệu hữu cơ tinh khiết nhất, từ những cánh hoa hồng sớm mai đến những giọt sương đọng trên lá mầm.

Chúng tôi tin rằng mỗi người phụ nữ đều sở hữu một ánh sáng nội tại riêng biệt. Sứ mệnh của Q&H LUMINA không phải là tạo ra một vẻ đẹp rập khuôn, mà là đánh thức và nâng niu vẻ rạng rỡ vốn có đó bằng những tinh túy từ lòng đất mẹ. Mỗi sản phẩm Q&H LUMINA là một lời cam kết về sự an toàn, minh bạch và hiệu quả vượt trội.

Qua hành trình gần một thập kỷ, Q&H LUMINA đã kiến tạo nên một cộng đồng yêu cái đẹp tự tử, nơi chúng ta cùng nhau tôn vinh sự đa dạng và lòng nhân ái. Chúng tôi không chỉ bán mỹ phẩm, chúng tôi trao gửi sự tự tin và niềm cảm hứng để bạn tỏa sáng là chính mình - rực rỡ và thuần khiết.`
  },
  'stores': {
    title: 'Hệ thống cửa hàng',
    body: `Q&H LUMINA tự hào sở hữu mạng lưới cửa hàng trải dài khắp các tỉnh thành lớn, mang đến không gian trải nghiệm cao cấp và chuyên nghiệp cho khách hàng:

1. Flagship Store HCM:
- Địa chỉ: 123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh.
- Giờ mở cửa: 09:00 - 22:00.

2. Concept Store Hà Nội:
- Địa chỉ: 45 Tràng Tiền, Quận Hoàn Kiếm, Hà Nội.
- Giờ mở cửa: 08:30 - 21:30.

3. Boutique Đà Nẵng:
- Địa chỉ: 88 Võ Nguyên Giáp, Quận Ngũ Hành Sơn, Đà Nẵng.
- Giờ mở cửa: 09:00 - 21:00.

Tại mỗi cửa hàng, chúng tôi cung cấp dịch vụ soi da miễn phí và tư vấn chuyên sâu từ các chuyên gia da liễu hàng đầu. Không gian được thiết kế theo phong cách tối giản, gần gũi với thiên nhiên, giúp quý khách thư giãn hoàn toàn trong khi lựa chọn những giải pháp chăm sóc sắc đẹp phù hợp nhất.`
  },
  'jobs': {
    title: 'Tuyển dụng',
    body: `Gia nhập đội ngũ Q&H LUMINA để cùng nhau kiến tạo những giá trị tốt đẹp cho cộng đồng yêu cái đẹp. Tại Q&H LUMINA, chúng tôi không phân biệt xuất thân hay bằng cấp, chúng tôi tìm kiếm những tâm hồn nhiệt huyết, đam mê sự hoàn mỹ và tinh thần làm việc bền bỉ.

Môi trường Q&H LUMINA mang lại:
- Không gian làm việc hiện đại, mang đậm tính nghệ thuật.
- Lộ trình thăng tiến rõ ràng và cơ hội đào tạo chuyên sâu về ngành làm đẹp toàn cầu.
- Chế độ phúc lợi hấp dẫn, thưởng định kỳ và ưu đãi đặc quyền cho nhân viên.

Các vị trí đang tìm kiếm:
1. Chuyên viên Tư vấn Da liễu (Làm việc tại cửa hàng).
2. Chuyên viên Nghiên cứu & Phát triển (R&D).
3. Chuyên viên Truyền thông & Sáng tạo nội dung (Creative Content).

Hãy gửi CV và tâm thư của bạn về địa chỉ hr@qhskinlab.com để bắt đầu hành trình tỏa sáng cùng chúng tôi.`
  },
  'contact': {
    title: 'Liên hệ với chúng tôi',
    body: `Q&H LUMINA luôn lắng nghe và sẵn sàng giải đáp mọi thắc mắc của quý khách hàng thông qua các kênh chính thức sau:

- Địa chỉ văn phòng: Tầng 10, Tòa nhà ABC Financial Tower, 456 Võ Văn Kiệt, Quận 1, Thành phố Hồ Chí Minh.
- Tổng đài hỗ trợ: 1900 636 510 (Hoạt động từ 8:30 đến 18:00, từ Thứ 2 đến Thứ 7).
- Hỗ trợ trực tuyến: m.me/qhskinlab (Messenger Facebook).
- Email chăm sóc khách hàng: contact@qhskinlab.com
- Hợp tác kinh doanh: partnership@qhskinlab.com

Đừng ngần ngại liên hệ với chúng tôi nếu bạn cần tư vấn về sản phẩm, hỗ trợ đơn hàng hoặc có bất kỳ góp ý nào để Q&H LUMINA hoàn thiện hơn mỗi ngày.`
  },
  'privacy': {
    title: 'Chính sách bảo mật',
    body: `Q&H LUMINA hiểu rằng quyền riêng tư là điều quý giá nhất của mỗi khách hàng. Chính sách bảo mật này được lập ra nhằm bảo vệ tuyệt đối thông tin cá nhân của quý khách:

1. Mục đích thu thập: Chúng tôi chỉ thu thập thông tin (họ tên, số điện thoại, địa chỉ) để xử lý đơn hàng, cung cấp dịch vụ tư vấn và thông báo các chương trình ưu đãi đặc quyền.
2. Cam kết bảo mật: Mọi dữ liệu đều được mã hóa theo tiêu chuẩn quốc tế và lưu trữ tại hệ thống máy chủ an toàn nhất. Chúng tôi tuyệt đối không cung cấp thông tin cho bên thứ ba vì mục đích thương mại.
3. Quyền của khách hàng: Quý khách có quyền yêu cầu truy cập, chỉnh sửa hoặc xóa bỏ thông tin cá nhân của mình bất kỳ lúc nào thông qua tài khoản cá nhân trên website hoặc liên hệ tổng đài.

Sự tin tưởng của quý khách là tài sản lớn nhất của Q&H LUMINA. Chúng tôi cam kết thực hiện đúng những gì đã tuyên bố để đảm bảo an toàn cho mọi giao dịch của bạn.`
  },
  'terms': {
    title: 'Điều khoản sử dụng',
    body: `Bằng việc truy cập và mua sắm tại Q&H LUMINA, quý khách đồng ý tuân thủ các điều khoản và quy định sau đây để đảm bảo một môi trường thương mại công bằng và văn minh:

- Quyền sở hữu trí tuệ: Toàn bộ nội dung, hình ảnh, video và thiết kế trên website thuộc quyền sở hữu của Q&H LUMINA. Mọi hành vi sao chép không được phép sẽ bị xử lý theo pháp luật.
- Thông tin cá nhân: Quý khách có trách nhiệm cung cấp thông tin chính xác khi đặt hàng. Q&H LUMINA không chịu trách nhiệm trong trường hợp giao hàng chậm trễ do sai sót thông tin từ phía khách hàng.
- Bình luận & Đánh giá: Chúng tôi khuyến khích những đóng góp mang tính xây dựng. Q&H LUMINA có quyền gỡ bỏ những nội dung mang tính chất xúc phạm, quảng cáo trái phép hoặc thiếu văn hóa.

Các điều khoản này có thể được cập nhật thường xuyên để phù hợp với quy định của pháp luật và sự phát triển của dịch vụ.`
  },
  'returns': {
    title: 'Chính sách đổi trả & Hoàn tiền',
    body: `Sự hài lòng của quý khách là ưu tiên số một của chúng tôi. Q&H LUMINA áp dụng chính sách đổi trả minh bạch như sau:

1. Thời hạn đổi trả: Trong vòng 30 ngày kể từ ngày nhận hàng thành công.
2. Điều kiện áp dụng:
- Sản phẩm còn nguyên tem mác, chưa qua sử dụng.
- Sản phẩm có lỗi từ nhà sản xuất (hỏng nắp, đổi màu, mùi lạ).
- Sản phẩm gây kích ứng da (được xác nhận bằng hình ảnh hoặc giấy của bác sĩ).
- Giao sai sản phẩm so với đơn hàng đã đặt.

3. Quy trình đổi trả: 
Liên hệ hotline 1900 636 510 -> Gửi hình ảnh minh chứng qua Zalo/Email -> Q&H LUMINA thu hồi và gửi sản phẩm mới hoặc hoàn tiền trong 3-5 ngày làm việc.

Chúng tôi mong muốn quý khách luôn an tâm tuyệt đối khi trải nghiệm các sản phẩm dưỡng nhan từ Q&H LUMINA.`
  },
  'shipping': {
    title: 'Chính sách vận chuyển & Giao nhận',
    body: `Q&H LUMINA nỗ lực mang những tinh túy thiên nhiên đến tận tay quý khách một cách nhanh chóng và an toàn nhất:

- Miễn phí vận chuyển: Áp dụng cho mọi đơn hàng có giá trị từ 500,000đ trở lên trên toàn quốc.
- Thời gian giao hàng:
  + Khu vực nội thành (HCM/Hà Nội): 1 - 2 ngày làm việc.
  + Các tỉnh thành khác: 3 - 5 ngày làm việc.

- Đối tác vận chuyển: Chúng tôi chỉ hợp tác với các đơn vị uy tín như Giao Hàng Tiết Kiệm, VNPost, DHL để đảm bảo hàng hóa được nâng niu trong suốt hành trình.
- Đồng kiểm: Quý khách có quyền mở thùng hàng kiểm tra số lượng và tình trạng sản phẩm trước khi thanh toán cho nhân viên giao hàng.

Mọi sự chậm trễ ngoài ý muốn do thiên tai hoặc sự cố vận tải sẽ được chúng tôi thông báo kịp thời đến quý khách.`
  },
  'guide': {
    title: 'Hướng dẫn mua hàng trực tuyến',
    body: `Để sở hữu những sản phẩm Q&H LUMINA yêu thích, quý khách chỉ cần thực hiện các bước đơn giản sau:

Bước 1: Khám phá sản phẩm - Truy cập trang chủ, xem các danh mục sản phẩm (Skincare, Makeup...) và đọc kỹ mô tả để chọn món phù hợp.
Bước 2: Thêm vào giỏ - Chọn số lượng và nhấn nút "Thêm vào giỏ hàng". Bạn có thể tiếp tục mua sắm hoặc tiến thanh toán.
Bước 3: Cung cấp thông tin - Điền chính xác địa chỉ, số điện thoại và email để nhận hóa đơn điện tử.
Bước 4: Chọn phương thức - Lựa chọn thanh toán COD, Chuyển khoản hoặc Ví điện tử.
Bước 5: Xác nhận - Kiểm tra lại đơn hàng lần cuối và nhấn "Hoàn tất đặt hàng".

Sau khi đặt thành công, một email xác nhận sẽ được gửi tự động và nhân viên tư vấn sẽ gọi điện xác thực trong vòng 30 phút.`
  },
  'payment': {
    title: 'Phương thức thanh toán an toàn',
    body: `Q&H LUMINA hỗ trợ đa dạng các hình thức thanh toán để quý khách thuận tiện nhất trong việc mua sắm:

1. Thanh toán khi nhận hàng (COD): Quý khách thanh toán tiền mặt trực tiếp cho nhân viên giao hàng sau khi đã kiểm tra sản phẩm.
2. Chuyển khoản ngân hàng: Quý khách chuyển tiền vào số tài khoản chính thức của công ty được hiển thị tại trang thanh toán. Vui lòng ghi mã đơn hàng trong nội dung chuyển khoản.
3. Ví điện tử: Hỗ trợ thanh toán nhanh qua Momo, ZaloPay, ShopeePay với nhiều chương trình hoàn tiền hấp dẫn.
4. Thẻ tín dụng/Ghi nợ: Chấp nhận các loại thẻ Visa, Mastercard, JCB thông qua cổng thanh toán bảo mật 3D Secure.

Tất cả các giao dịch trực tuyến đều được mã hóa SSL để đảm bảo an toàn tuyệt đối cho thông tin tài chính của quý khách.`
  },
  'faq': {
    title: 'Câu hỏi thường gặp (FAQ)',
    body: `Dưới đây là giải đáp cho những thắc mắc thường thấy nhất của khách hàng Q&H LUMINA:

- Sản phẩm có dùng được cho phụ nữ mang thai không? 
Hầu hết sản phẩm Q&H LUMINA có nguồn gốc hữu cơ và rất lành tính. Tuy nhiên với các dòng có Retinol hoặc Acid cao, chúng tôi khuyên bạn nên tham khảo ý kiến bác sĩ hoặc tư vấn viên trước khi dùng.

- Làm sao để biết hạn sử dụng?
Hạn sử dụng in trực tiếp trên bao bì (EXP). Sau khi mở nắp, vui lòng dùng trong vòng 6-12 tháng tùy ký hiệu (M) trên vỏ hộp.

- Tôi có thể thay đổi đơn hàng sau khi đặt không?
Có thể, miễn là đơn hàng chưa được chuyển sang trạng thái "Đang giao". Vui lòng gọi ngay 1900 636 510 để được hỗ trợ kịp thời.

- Q&H LUMINA có cung cấp gói quà không?
Có, chúng tôi cung cấp dịch vụ đóng gói quà tặng cao cấp và thiệp viết tay cho các dịp lễ đặc biệt. Vui lòng ghi chú trong đơn hàng của bạn.`
  },
  'tracking': {
    title: 'Tra cứu hành trình đơn hàng',
    body: `Q&H LUMINA tin rằng sự chờ đợi một món quà sắc đẹp nên là sự chờ đợi đầy hứng khởi. Quý khách có thể theo dõi đơn hàng bằng các cách sau:

1. Tra cứu tự động: Nhập mã đơn hàng (được gửi qua email/SMS) vào ô tra cứu tại trang cá nhân hoặc chân trang website. Hệ thống sẽ kết nối trực tiếp với nhà vận chuyển để hiển thị vị trí thực tế.
2. Qua email: Mỗi khi đơn hàng thay đổi trạng thái (Đã đóng gói, Đã xuất kho, Đang giao), chúng tôi sẽ gửi email thông báo kèm link tracking chi tiết.
3. Tổng đài: Gọi 1900 636 510 và đọc mã đơn hàng hoặc số điện thoại, nhân viên của chúng tôi sẽ thông tin chính xác thời gian dự kiến bạn nhận được hàng.

Hãy yên tâm rằng đơn hàng của bạn đang được nâng niu trên mọi nẻo đường!`
  }
};

export default function StaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const content = slug ? contentMap[slug] : null;

  if (!content) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <h1 className="text-2xl font-serif text-gray-400 font-bold uppercase tracking-widest text-blue-400">Không tìm thấy trang</h1>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-6 py-24"
    >
      <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-12 border-b border-brand-100 pb-8 tracking-tight">
        {content.title}
      </h1>
      <div className="prose prose-brand max-w-none">
        <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-line">
          {content.body}
        </p>
      </div>
    </motion.div>
  );
}
